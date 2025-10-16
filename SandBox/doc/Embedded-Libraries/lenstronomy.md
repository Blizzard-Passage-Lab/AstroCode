# lenstronomy Python API 知识库

## 概述
- **库**: `lenstronomy`
- **版本**: 1.12.5+
- **用途**: 强引力透镜建模、模拟与参数推断。
- **核心流程**: 定义模型(透镜/光源) -> 定义数据/仪器(像素网格/PSF) -> 模拟图像 -> 设置参数空间 -> 运行采样器(PSO/MCMC) -> 分析结果。
- **关键机制**: 线性参数(如振幅`amp`)通过**线性反演**求解，不参与非线性采样，以提高效率。

---

## 1. `LensModel`: 透镜模型模块
- **路径**: `lenstronomy.LensModel.lens_model.LensModel`
- **功能**: 计算所有引力透镜效应。支持单平面/多平面。
- **初始化**:
  - `lens_model_list` (`list[str]`): 模型名称列表。例: `['EPL', 'SHEAR']`。
  - `multi_plane` (`bool`): `True`启用多平面。
  - `z_source` (`float`): 源红移 (多平面)。
  - `lens_redshift_list` (`list[float]`): 透镜红移列表 (多平面)。
- **参数**: `kwargs_lens` (`list[dict]`)，列表内每个字典对应`lens_model_list`中的一个模型。
- **核心方法**:
  - `.ray_shooting(theta_ra, theta_dec, kwargs_lens)`: 射线追踪，返回源平面坐标 `beta_ra, beta_dec`。
  - `.magnification(theta_ra, theta_dec, kwargs_lens)`: 计算像点放大率。
  - `.fermat_potential(...)`: 计算费马势。
  - `.arrival_time(...)`: 计算到达时间 (多平面)。
  - `.hessian()`, `.convergence()`, `.shear()`: 计算二阶导数及相关量。
- **求解器**:
  - **路径**: `lenstronomy.LensModel.Solver.lens_equation_solver.LensEquationSolver`
  - **功能**: 求解透镜方程。
  - **方法**: `.image_position_from_source(beta_ra, beta_dec, kwargs_lens)`，从源位置反解像位置。

---

## 2. `LightModel`: 光分布模型模块
- **路径**: `lenstronomy.LightModel.light_model.LightModel`
- **功能**: 描述星系表面亮度分布 (光源/透镜光)。
- **初始化**: `light_model_list` (`list[str]`)。例: `['SERSIC']`, `['SERSIC_ELLIPSE']`。
- **参数**: `kwargs_source` 或 `kwargs_lens_light` (`list[dict]`)。
- **关键参数**: `amp` (振幅)，这是一个**线性参数**。
- **核心方法**: `.surface_brightness(x, y, kwargs_list)`: 计算指定坐标的表面亮度。

---

## 3. `PointSource`: 点源模型模块
- **路径**: `lenstronomy.PointSource.point_source.PointSource`
- **功能**: 模拟透镜化的点源 (如类星体)。
- **初始化**:
  - `point_source_type_list` (`list[str]`): 点源类型。
    - `'SOURCE_POSITION'`: 在源平面定义，自动求解像位置。
    - `'LENSED_POSITION'`: 在像平面直接定义。
  - `lens_model`: 需传入`LensModel`实例用于计算。
- **参数**: `kwargs_ps` (`list[dict]`)。
- **核心方法**:
  - `.image_position(kwargs_ps, kwargs_lens)`: 获取像位置。
  - `.image_amplitude(kwargs_ps, kwargs_lens)`: 获取像振幅。

---

## 4. 数据与仪器 (`Data`, `ImSim`)
- **目标**: 从模型生成模拟图像。
- **组件**:
  - **`PixelGrid`**:
    - **路径**: `lenstronomy.Data.pixel_grid.PixelGrid`
    - **功能**: 管理坐标网格，实现像素坐标 `(x, y)` 与角坐标 `(ra, dec)` 转换。
    - **关键参数**: `nx`, `ny`, `transform_pix2angle`, `ra_at_xy_0`, `dec_at_xy_0`。
  - **`PSF`**:
    - **路径**: `lenstronomy.Data.psf.PSF`
    - **功能**: 定义点扩展函数 (PSF)。
    - **关键参数**: `psf_type` (`'GAUSSIAN'` 或 `'PIXEL'`), `fwhm`, `pixel_size`。
  - **`ImageModel`**:
    - **路径**: `lenstronomy.ImSim.image_model.ImageModel`
    - **功能**: **核心图像生成器**。组合 `LensModel`, `LightModel`, `PointSource`, `PixelGrid`, `PSF` 生成最终图像。
    - **初始化**: 传入各模块的实例 (`data_class`, `psf_class`, ...)。
    - **数值参数**: `kwargs_numerics` (`dict`)，控制精度。如 `'supersampling_factor'`。
    - **核心方法**: `.image(kwargs_lens, kwargs_source, ...)`: 生成无噪模拟图像。
- **噪声添加**:
  - **路径**: `lenstronomy.Util.image_util`
  - **函数**: `.add_poisson()`, `.add_background()`。

---

## 5. 线性反演 (`ImageLinearFit`)
- **路径**: `lenstronomy.ImSim.image_linear_solve.ImageLinearFit`
- **功能**: 在给定非线性参数下，通过线性最小二乘法快速求解所有**线性参数** (`amp`)。
- **继承**: `ImageModel`。
- **初始化**: 需要一个包含真实数据和噪声信息的 `data_class` 实例 (`ImageData`)。
- **核心方法**: `.image_linear_solve(kwargs_lens, kwargs_source, ...)`
  - **输入**: **不含**`'amp'`的`kwargs`。
  - **输出**: 重建图像、误差图等。

---

## 6. 采样与拟合 (`Sampling`, `Workflow`)

### 6.1. 底层模块 (`Sampling`)
- **`Param`**:
  - **路径**: `lenstronomy.Sampling.parameters.Param`
  - **功能**: **核心参数管理器**。
  - **作用**:
    1.  转换 `kwargs` (字典列表) 与 `args` (采样器使用的1D `numpy`数组)。
    2.  管理固定参数 (`kwargs_fixed_*`)。
    3.  管理参数边界 (`kwargs_lower_*`, `kwargs_upper_*`)。
    4.  处理参数间约束 (`kwargs_constraints`)，如 `joint_lens_with_light`。
  - **核心方法**: `.kwargs2args(...)`, `.args2kwargs(...)`, `.num_param()`。
- **`LikelihoodModule`**:
  - **路径**: `lenstronomy.Sampling.likelihood.LikelihoodModule`
  - **功能**: 计算给定参数下的对数似然度 (`logL`)。
  - **初始化**: 传入数据、模型、`Param`实例等。
  - **核心方法**: `.logL(args)`。
- **`Sampler`**:
  - **路径**: `lenstronomy.Sampling.sampler.Sampler`
  - **功能**: 执行具体采样算法的包装器。
  - **方法**: `.pso(...)` (粒子群优化)。

### 6.2. 高层工作流 (`Workflow`)
- **`FittingSequence`**:
  - **路径**: `lenstronomy.Workflow.fitting_sequence.FittingSequence`
  - **功能**: **自动化、序列化拟合流程**。将多个步骤 (如 PSO, MCMC) 串联执行。
  - **初始化**: 接收所有配置 `kwargs` (data, model, constraints, likelihood, params)。
  - **核心方法**: `.fit_sequence(fitting_kwargs_list)`
    - `fitting_kwargs_list`: 定义拟合步骤和参数的列表。
    - 例: `[['PSO', {'n_particles': 200, 'n_iterations': 200}], ['MCMC', {'n_burn': 200, 'n_run': 200, 'n_walkers': 100}]]`
  - **输出**: `chain_list`, `kwargs_result` (最佳拟合参数)。

---

## 7. 后处理与可视化
- **`ModelPlot`**:
  - **路径**: `lenstronomy.Plots.model_plot.ModelPlot`
  - **功能**: 可视化数据、模型、残差和重构的源。
  - **核心方法**: `.data_plot()`, `.model_plot()`, `.normalized_residual_plot()`, `.source_plot()`, `.convergence_plot()`, `.magnification_plot()`, `.decomposition_plot()`。
- **`chain_plot` & `corner`**:
  - **路径**: `lenstronomy.Plots.chain_plot`
  - **库**: `corner`
  - **功能**: 可视化 MCMC 链的收敛性和后验概率分布。