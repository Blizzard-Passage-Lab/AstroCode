# 环境变量配置示例

由于权限限制，无法直接创建 `.env` 文件，请手动创建 `.env` 文件并添加以下配置：

## OpenAI API 配置
```env
# 从 https://platform.openai.com/api-keys 获取 API 密钥
OPENAI_API_KEY=your_openai_api_key_here

# OpenAI API 基础 URL（可选，默认为 https://api.openai.com/v1）
OPENAI_BASE_URL=https://api.openai.com/v1

# OpenAI 模型名称（可选，默认为 gpt-4o）
OPENAI_MODEL=gpt-4o
```

## Gemini API 配置（可选）
```env
# 从 https://makersuite.google.com/app/apikey 获取 API 密钥
GEMINI_API_KEY=your_gemini_api_key_here
```

## Google Cloud 配置（用于 Vertex AI，可选）
```env
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_LOCATION=your_location
```

## 其他配置
```env
# 用于网络搜索工具（可选）
TAVILY_API_KEY=your_tavily_api_key_here
```

## 使用说明

1. 在项目根目录创建 `.env` 文件
2. 复制上述相应的配置到 `.env` 文件中
3. 替换 `your_*_here` 为实际的 API 密钥和配置值
4. 重启应用以加载新的环境变量

## 支持的鉴权方式

修改后的系统支持以下鉴权方式：
- **OpenAI API**：使用 `OPENAI_API_KEY` 等配置
- **Gemini API Key**：使用 `GEMINI_API_KEY` 配置  
- **Vertex AI**：使用 Google Cloud 相关配置

**注意**：已移除 OAuth 登录功能，包括 Qwen OAuth 和 Google OAuth。
