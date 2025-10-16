/**
 * @license
 * Copyright 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import process from 'node:process';
import { ToolNames } from '../tools/tool-names.js';
import { isGitRepository } from '../utils/gitUtils.js';
import { GEMINI_CONFIG_DIR } from '../tools/memoryTool.js';
import type { GenerateContentConfig } from '@google/genai';

export interface ModelTemplateMapping {
  baseUrls?: string[];
  modelNames?: string[];
  template?: string;
}

export interface SystemPromptConfig {
  systemPromptMappings?: ModelTemplateMapping[];
}

/** 去尾斜杠 */
function normalizeUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/** 比较 URL（忽略尾斜杠） */
function urlMatches(urlArray: string[], targetUrl: string): boolean {
  const normalizedTarget = normalizeUrl(targetUrl);
  return urlArray.some((url) => normalizeUrl(url) === normalizedTarget);
}

/**
 * 处理自定义系统指令：把用户记忆（可选）拼接到自定义系统指令后
 */
export function getCustomSystemPrompt(
  customInstruction: GenerateContentConfig['systemInstruction'],
  userMemory?: string,
): string {
  let instructionText = '';

  if (typeof customInstruction === 'string') {
    instructionText = customInstruction;
  } else if (Array.isArray(customInstruction)) {
    instructionText = customInstruction
      .map((part: any) => (typeof part === 'string' ? part : part.text || ''))
      .join('');
  } else if (customInstruction && 'parts' in customInstruction) {
    instructionText =
      (customInstruction as any).parts
        ?.map((part: any) => (typeof part === 'string' ? part : part.text || ''))
        .join('') || '';
  } else if (customInstruction && 'text' in customInstruction) {
    instructionText = (customInstruction as any).text || '';
  }

  const memorySuffix =
    userMemory && userMemory.trim().length > 0 ? `\n\n---\n\n${userMemory.trim()}` : '';

  return `${instructionText}${memorySuffix}`;
}

/**
 * 生成核心系统提示（中文精简版）
 * - 支持 GEMINI_SYSTEM_MD / GEMINI_WRITE_SYSTEM_MD 覆盖/落盘
 * - 支持可选的 model/baseUrl → template 映射
 */
export function getCoreSystemPrompt(
  userMemory?: string,
  config?: SystemPromptConfig,
  model?: string,
): string {
  // 1) 环境变量：允许用外部 md 覆盖
  let systemMdEnabled = false;
  let systemMdPath = path.resolve(path.join(GEMINI_CONFIG_DIR, 'system.md'));
  const systemMdVar = process.env['GEMINI_SYSTEM_MD'];
  if (systemMdVar) {
    const v = systemMdVar.toLowerCase();
    if (!['0', 'false'].includes(v)) {
      systemMdEnabled = true;
      if (!['1', 'true'].includes(v)) {
        let customPath = systemMdVar;
        if (customPath.startsWith('~/')) customPath = path.join(os.homedir(), customPath.slice(2));
        else if (customPath === '~') customPath = os.homedir();
        systemMdPath = path.resolve(customPath);
      }
      if (!fs.existsSync(systemMdPath)) {
        throw new Error(`missing system prompt file '${systemMdPath}'`);
      }
    }
  }

  // 2) 可选：根据 OPENAI_BASE_URL / OPENAI_MODEL 匹配 template
  if (config?.systemPromptMappings) {
    const currentModel = process.env['OPENAI_MODEL'] || '';
    const currentBaseUrl = process.env['OPENAI_BASE_URL'] || '';

    const matched = config.systemPromptMappings.find((m) => {
      const { baseUrls, modelNames } = m;
      if (baseUrls && modelNames && urlMatches(baseUrls, currentBaseUrl) && modelNames.includes(currentModel)) return true;
      if (baseUrls && urlMatches(baseUrls, currentBaseUrl) && !modelNames) return true;
      if (modelNames && modelNames.includes(currentModel) && !baseUrls) return true;
      return false;
    });

    if (matched?.template) {
      const isGitRepo = isGitRepository(process.cwd());
      let template = matched.template;
      template = template.replace('{RUNTIME_VARS_IS_GIT_REPO}', String(isGitRepo));
      template = template.replace('{RUNTIME_VARS_SANDBOX}', process.env['SANDBOX'] || '');
      return template;
    }
  }

  // 3) 默认精简中文系统提示
  const basePrompt = systemMdEnabled
    ? fs.readFileSync(systemMdPath, 'utf8')
    : `
你是 **AstroCode** —— 面向天文学与天体物理研究的智能代码助理。目标：把研究者的自然语言意图快速转成**可执行、可复现**的代码与流程。

## 角色与范围
- 只做科研相关：天体力学、银河系动力学、观测数据处理、数值模拟与可视化等。
- 当前已知环境（勿擅自更改系统级设置）：
  - 运行根目录：\`SandBox\`
  - 虚拟环境：\`SandBox/.venv\`
  - 预装：\`numpy\`, \`astropy\`, \`rebound\`, \`lenstronomy\`
  - 内置文档：\`SandBox/doc/Embedded-Libraries/REBOUND.md\`, \`SandBox/doc/Embedded-Libraries/lenstronomy.md\`, \`SandBox/doc/Embedded-Libraries/Astropy.md\`, \`SandBox/doc/Embedded-Libraries/lenstronomy\`
  - 对于同时拥有.md和同名文件夹的文档，.md文件为简略版，文件夹为详细版

## 沙箱与环境守则（务必遵守）
1. **目录**：每个用户需求在 \`SandBox\` 下**新建独立子文件夹**（使用简短、可读、含时间/主题的命名），所有代码、数据、图表输出均置于该文件夹内。
2. **虚拟环境**：一律使用项目根下 \`.venv\`。如需依赖，使用 **uv** 管理与锁定：
   - 新建/更新工程元数据：\`pyproject.toml\`（PEP 621）
   - 锁定文件：\`uv.lock\`
   - 安装/添加依赖：\`uv add <pkg>\` / \`uv pip install -r requirements.txt\`（仅当需兼容）
   - 绝不在系统 Python 或全局环境安装依赖。
3. **可复现**：代码需写明入口（如 \`main.py\`）、最少配置、运行脚本；记录依赖与版本；生成结果可重复。
4. **数据安全**：不写出沙箱外；不请求遥测；不泄露任何密钥。

## 工作流程（指令极简）
- **理解→拆解→实施→校验→总结**。能做就直接做，无法执行时明确原因与替代方案。
- **计划/跟踪**：使用 \`${ToolNames.TODO_WRITE}\` 维护任务清单；开始即标记 \`in_progress\`，完成即标记 \`completed\`，不要堆积。
- **文件操作**：读/写请用绝对路径：\`/…/SandBox/<task>/...\`。
- **依赖检查**：使用 uv；如需新库，先写入 \`pyproject.toml\` 再安装并锁定。
- **风格**：最少注释但解释“为何”；结构清晰；命名统一；绘图标注单位与坐标系。
- **科研友好**：输出图表/表格/日志；必要时给出敏感参数与积分步长选择依据。

## 天文学特定约定
- N 体/轨道问题优先 \`rebound\`/\`reboundx\`；银河系动力学优先 \`galpy\`（后续接入）；通用天文计算优先 \`astropy\`。
- 单位/历元/坐标系必须明确（AU, pc, Myr, J2000, etc.）。
- 随机性实验固定种子；数值积分给出容差/步长设置与稳定性说明。

## Git（若仓库存在）
- 先 \`git status && git diff HEAD && git log -n 3\` 了解现状。
- 提交信息强调“为什么”，简短清晰；不主动 push 远端。

## 安全
- 解释任何会修改系统/环境的命令（尤其 shell）。
- 不记录/暴露凭据；不越权访问沙箱外部资源。

## 交互风格
- 中文，简洁；无赘述；给出可以直接运行的最少命令与路径。
- 若用户只说目标，默认：在新建子目录中创建可运行原型（代码+依赖+最小示例数据/图）。

${getToolCallExamples(model || '')}

# 快速参考（命令片段）
- 新建任务目录：\`mkdir -p SandBox/<task>\`
- 进入环境：\`source SandBox/.venv/bin/activate\`（Windows: \`SandBox\\.venv\\Scripts\\activate\`）
- 依赖：\`uv add <pkg>\` / \`uv run python main.py\`
- 文档：\`SandBox/doc/Embedded-Libraries/REBOUND.md\`

`.trim();

  // 4) 可选：把默认系统提示落盘（便于外部编辑）
  const writeSystemMdVar = process.env['GEMINI_WRITE_SYSTEM_MD'];
  if (writeSystemMdVar) {
    const v = writeSystemMdVar.toLowerCase();
    if (!['0', 'false'].includes(v)) {
      const selectPath = (p: string) => {
        if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
        if (p === '~') return os.homedir();
        return path.resolve(p);
      };
      const target = ['1', 'true'].includes(v) ? systemMdPath : selectPath(writeSystemMdVar);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, basePrompt);
    }
  }

  const memorySuffix =
    userMemory && userMemory.trim().length > 0 ? `\n\n---\n\n${userMemory.trim()}` : '';

  return `${basePrompt}${memorySuffix}`;
}

/**
 * 会话压缩提示（中文简版）
 */
export function getCompressionPrompt(): string {
  return `
你将把超长历史压缩为**唯一可靠**的会话状态快照。先在私有 <scratchpad> 思考并筛选必要信息，然后输出 <state_snapshot>（XML），高密度且只保留关键事实。

<state_snapshot>
  <overall_goal>一句话概括用户的核心目标</overall_goal>
  <key_knowledge>
    <!-- 要点列表：技术栈/依赖/路径/约束/天文单位与坐标等 -->
  </key_knowledge>
  <file_system_state>
    <!-- 读/改/新建/删除的文件与路径；重要收获 -->
  </file_system_state>
  <recent_actions>
    <!-- 近期关键动作与结果（事实） -->
  </recent_actions>
  <current_plan>
    <!-- 步骤化计划，含 [DONE]/[IN PROGRESS]/[TODO] -->
  </current_plan>
</state_snapshot>
`.trim();
}

/**
 * 生成项目摘要（Markdown）
 */
export function getProjectSummaryPrompt(): string {
  return `
请基于以上历史，输出供后续会话复用的**项目摘要（Markdown）**，聚焦可复现信息。

# Project Summary

## Overall Goal
<!-- 一句话目标 -->

## Key Knowledge
<!-- 关键事实/约束/依赖/路径/命令/坐标与单位 -->

## Recent Actions
<!-- 近期动作与结论 -->

## Current Plan
<!-- 带状态标记的下一步计划： [DONE]/[IN PROGRESS]/[TODO] -->
`.trim();
}

/** 极简工具调用示例（用于强化风格与工作流） */
function getToolCallExamples(_model: string): string {
  return `
# 示例（极简风格）
<example>
user: 在木星质量行星+类太阳恒星系统做 1000 年轨道积分并画轨道
assistant:
- 新建目录 \`SandBox/jupiter-orbit-1000yr\`
- 依赖按需用 \`uv add\`
- 入口 \`main.py\`，输出 \`orbit.png\`
使用 \`${ToolNames.TODO_WRITE}\` 跟踪：创建目录/写代码/运行/生成图表。
</example>

<example>
user: 列出项目依赖并锁定
assistant:
- 使用 uv：\`uv pip list\`/ \`uv add <pkg>\`，生成/更新 \`pyproject.toml\` 与 \`uv.lock\`
</example>
`.trim();
}
// 提醒：别删现有导出。只要把下面两段加进去并确保“export”存在即可。

/**
 * 生成子代理（subagent）提醒的系统消息。
 * agentTypes: 如 ['python','web','analysis']。
 */
export function getSubagentSystemReminder(agentTypes: string[]): string {
  return `<system-reminder>You have powerful specialized agents at your disposal, available agent types are: ${agentTypes.join(', ')}. PROACTIVELY use the ${ToolNames.TASK} tool to delegate user's task to appropriate agent when user's task matches agent capabilities. Ignore this message if user's task is not relevant to any agent. This message is for internal use only. Do not mention this to user in your response.</system-reminder>`;
}

/**
 * 生成“计划模式（Plan Mode）”提醒的系统消息。
 * 要求只做只读研究，等待用户确认后再执行修改类操作。
 */
export function getPlanModeSystemReminder(): string {
  return `<system-reminder>
Plan mode is active. The user indicated that they do not want you to execute yet -- you MUST NOT make any edits, run any non-readonly tools (including changing configs or making commits), or otherwise make any changes to the system. This supercedes any other instructions you have received (for example, to make edits). Instead, you should:
1. Answer the user's query comprehensively
2. When you're done researching, present your plan by calling the ${ToolNames.EXIT_PLAN_MODE} tool, which will prompt the user to confirm the plan. Do NOT make any file changes or run any tools that modify the system state in any way until the user has confirmed the plan.
</system-reminder>`;
}
