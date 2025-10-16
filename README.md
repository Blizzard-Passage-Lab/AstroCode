# AstroCode: 您的智能天文学研究助手

AstroCode 是一个旨在彻底改变天文学家和天体物理学家与复杂数据处理和仿真工具交互方式的项目。通过利用人工智能（AI）的力量，AstroCode 将自然语言指令转化为可执行的代码，从而将繁琐的软件学习过程转变为自动化、直观的操作。无论您是经验丰富的研究员还是刚刚起步的学生，AstroCode 都能帮助您更专注于科学发现本身，而非工具的细节

## 项目目标

在天文学研究中，数据处理和仿真是不可或缺的一环。然而，学习和掌握各种专业的软件包（如REBOUND）通常需要陡峭的学习曲线。AstroCode 的核心目标是消除这一障碍。

我们设想一个未来：研究人员可以简单地用自然语言描述他们的研究需求，例如“模拟一颗行星围绕恒星的轨道”，然后 AstroCode 将自动生成相应的 Python 代码并执行仿真。这不仅仅是代码生成，更是科研范式的革新——将科研人员从繁琐的技术细节中解放出来，让他们能将更多精力投入到创新和探索中。

## 技术栈

AstroCode 构建在一系列强大的开源技术之上：

*   **核心框架**: 基于 `QwenCode-CLI`（一个由 `Gemini-CLI` 修改而来的代码生成命令行工具）进行二次开发，专为天文学科研任务优化。
*   **核心库支持**: 目前，AstroCode 内置了对 `REBOUND`（一个强大的 N 体问题积分器）和 `galpy`（一个用于银河系动力学研究的 Python 库）的支持，并包含了它们详细的 API 文档作为知识库。未来，我们将逐步扩展支持的库和文档。
*   **运行环境**: 项目在 `SandBox` 文件夹下运行，所有的项目共享一个预先配置好的天文学计算 Python 环境。每个新任务都会在 `SandBox` 下创建一个独立的文件夹作为工作目录，CLI 会在此目录中自动编写和运行代码，并可以灵活地使用项目自带的 `venv` 环境或指定的 `conda` 环境。

## 天文学中的应用

为了实现 AstroCode 的宏伟目标，我们精心挑选了一系列在天文学领域广泛使用、拥有完善文档并且可以通过 Python 进行调用的开源工具。

### 精选的开源库/软件

以下是 AstroCode 计划逐步整合的天文学软件包：

| 软件包         | 主要用途                                                     |
| :------------- | :----------------------------------------------------------- |
| **Astropy**    | 天文学计算的核心库，提供了通用的数据结构、单位和坐标转换、文件 I/O（如 FITS）以及丰富的天体物理计算功能。 |
| **Photutils**  | 一个 `Astropy` 的附属包，专门用于天文图像中的源检测和光度测量。 |
| **Specutils**  | 另一个 `Astropy` 的附属包，用于光谱数据的读取、分析和可视化。 |
| **Astroquery** | 一个用于从各种天文学档案库（如 NASA Exoplanet Archive, SIMBAD）查询和下载数据的工具集。 |
| **AstroML**    | 一个将机器学习算法应用于天文学数据集的库，建立在 `scikit-learn` 之上。 |
| **REBOUND**    | 多体引力 N 体积分（行星系统/小天体/环粒子）python包          |
| **REBOUNDx**   | 在 REBOUND 上加入额外物理，如潮汐阻尼、广义相对论项、辐射阻力等 |
| ......         | 未完待续！                                                   |

### 一个具体的应用场景：系外行星轨道仿真

设想一位天文学家想要研究一颗新发现的系外行星的轨道稳定性。传统上，他可能需要花费大量时间学习如何使用像 `REBOUND` 这样的 N 体仿真软件。而使用 AstroCode，他只需要用自然语言提出需求：

> **用户**: "创建一个包含一颗类太阳恒星和一颗木星质量行星的系统。行星的半长轴为 5.2 AU，偏心率为 0.048。模拟系统演化 1000 年，并绘制行星的轨道图。"

AstroCode 接收到这个指令后，会利用其内置的 `REBOUND` API 文档知识库，自动生成如下的 Python 代码：

```python
import rebound
import matplotlib.pyplot as plt

# 创建一个新的仿真实例
sim = rebound.Simulation()

# 添加恒星 (类太阳)
sim.add(m=1.0)

# 添加行星 (木星质量, 半长轴 5.2 AU, 偏心率 0.048)
sim.add(m=9.543e-4, a=5.2, e=0.048)

# 移动到质心坐标系
sim.move_to_com()

# 准备存储轨道数据
N_orbits = 100
times = np.linspace(0., 1000. * 2 * np.pi, N_orbits)
x = np.zeros(N_orbits)
y = np.zeros(N_orbits)

# 进行仿真并记录数据
for i, time in enumerate(times):
    sim.integrate(time)
    x[i] = sim.particles[1].x
    y[i] = sim.particles[1].y

# 绘制轨道图
fig, ax = plt.subplots()
ax.plot(x, y)
ax.set_aspect('equal')
ax.set_xlabel("X [AU]")
ax.set_ylabel("Y [AU]")
plt.title("Exoplanet Orbit Simulation")
plt.grid(True)
plt.show()
```

这段代码随后会在 `SandBox` 环境中自动执行，生成并展示行星的轨道图，从而让研究人员能够直观地评估其稳定性。

## 不止于天文学

AstroCode 的愿景远不止于天文学领域。其核心理念——通过 AI 赋能，将复杂的专业软件转化为易于使用的自然语言工具——具有广泛的适用性。

未来，我们计划将 AstroCode 的能力扩展到其他科学和工程领域，例如：

*   **电磁学**: 集成 `Meep` 库，让用户可以通过自然语言描述来设计和仿真光学器件。
*   **计算流体力学**: 支持 `OpenFOAM` 或其他 CFD 软件的 Python 接口，简化流体动力学仿真。
*   **通用工程仿真**: 整合如 `Ansys` 等商业软件的 Python API，为更广泛的工程问题提供智能化的解决方案。

我们相信，通过不断扩展支持的软件库和知识库，AstroCode 将有潜力成为一个跨学科的、不可或的auto-generated-code-box

## Q&A

Q：AstroCode和Gemini-CLI，Claude Code以及其他Agent代码软件、项目有什么区别？

A：AstroCode是专为天文学领域设计的Agent，成本更低，效率和准确性更高，同时拥有丰富的天文学知识






npm run build
npm run bundle

node bundle/gemini.js