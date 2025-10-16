

## REBOUND Python API 知识库

### 核心对象

REBOUND 的使用主要围绕两个 Python 对象：

1.  `rebound.Simulation`: 包含一个 REBOUND 模拟的所有配置、状态和粒子数据。
2.  `rebound.Particle`: 代表模拟中的一个粒子。

REBOUND 是一个模块化代码，允许组合不同的模块，例如：
- 引力求解器 (`gravity`)
- 碰撞检测算法 (`collision`)
- 边界条件 (`boundary`)
- 积分方法 (`integrator`)

### `Simulation` 对象

#### 生命周期

**1. 创建和销毁**

- **创建**: 创建一个新的 `Simulation` 对象会分配内存并初始化所有变量为默认值。
  ```python
  sim = rebound.Simulation()
  ```
- **销毁**: Python 会在对象的最后一个引用消失后自动释放内存。通常不需要手动操作。
  ```python
  sim = None  # 允许 Python 释放内存
  ```

**危险**:
在 `sim` 对象被释放后，不要保留对其内部数组（如 `particles`）的引用。因为 `sim` 释放时，`particles` 数组的内存也会被释放，继续访问会导致段错误。
```python
sim = rebound.Simulation()
sim.add(m=1)
particles = sim.particles
sim = None           # 释放 simulation
print(particles[0].x) # 段错误
```

**2. 配置根盒子 (Root Boxes)**

在以下情况下需要初始化模拟的根盒子：
- 使用树代码进行碰撞检测或引力计算。
- 使用开放、周期性或剪切周期性边界条件。

初始化在创建模拟后进行：
```python
sim = rebound.Simulation()
size = 100.
# 配置一个大小为 100 的盒子，x, y, z 方向分别有 1, 2, 3 个根盒子
sim.configure_box(size, 1, 2, 3);
```
在大多数情况下，每个方向都只需要一个根盒子。

#### `Simulation` 对象的变量

通过对象属性直接访问和设置变量。
```python
sim = rebound.Simulation()
sim.G = 1.0    # 设置引力常数
print(sim.t)   # 打印当前模拟时间
```

**1. 时间步进 (Timestepping)**

- `t` (浮点数): 当前模拟时间。默认值为 0。
- `dt` (浮点数): 当前时间步长。默认值为 0.001。应设置为问题中最短动力学时标的一小部分（百分之几）。对于自适应积分器（如 IAS15），这作为初始猜测值。
- `dt_last_done` (浮点数): REBOUND 设置的最后一个使用的时间步长。用户不应手动设置。
- `steps_done` (无符号长整型): 已完成的时间步数。
- `exact_finish_time` (整数): 在 Python 中，这不是一个直接设置的变量，而是作为 `integrate()` 方法的一个参数。
  - `sim.integrate(T, exact_finish_time=1)` (默认): REBOUND 将精确积分到请求的时间 `T`，可能会在最后一步减小时间步长。
  - `sim.integrate(T, exact_finish_time=0)`: REBOUND 不会减小时间步长，而是会稍微超过请求的时间 `T`。
  ```python
  sim = rebound.Simulation()
  sim.integrator = "leapfrog" # 使用固定时间步长
  sim.dt = 10
  sim.integrate(15, exact_finish_time=0)
  print(sim.t)                # 将打印 20
  sim.integrate(25, exact_finish_time=1)
  print(sim.t)                # 将打印 25
  ```
- `walltime` (浮点数): 记录 REBOUND 用于此模拟的墙上时间（秒），仅计算积分本身。
- `heartbeat` (函数指针): 在模拟开始和每个时间步结束时调用的函数。可用于跟踪、终止或输出数据。
  ```python
  def heartbeat(sim_pointer):
      sim = sim_pointer.contents
      print(sim.t)
  
  sim = rebound.Simulation()
  sim.heartbeat = heartbeat
  ```
- `pre_timestep_modifications` / `post_timestep_modifications` (函数指针): 类似于 `heartbeat`，允许在每个时间步前后进行修改。

**2. 引力 (Gravity)**

- `G` (浮点数): 引力常数。默认为 1。
- `softening` (浮点数): 引力软化参数，用于消除小尺度上的强力梯度（例如近距离接触）。默认为 0（无软化）。
- `opening_angle2` (浮点数): 当使用基于树的引力计算时，此变量决定计算的准确性。它是单元张角 `theta` 的平方。
- `force_is_velocity_dependent` (无符号整数): 如果设置为 0（默认），则力不能包含速度依赖项。设置为 1 速度较慢，但允许速度依赖的力（如阻力）。
- `gravity_ignore_terms` (无符号整数): 决定是否在引力计算中包含中心天体的引力。通常由积分器自动设置。
- `additional_forces` (函数指针): 允许用户添加额外的（非引力）力。

**3. 粒子 (Particles)**

- `particles` (粒子数组): 所有粒子都存储在此数组中。
  ```python
  sim = rebound.Simulation()
  # ... 设置模拟, 添加粒子 ...
  sim.particles[0].x = 1
  ```
  **注意**: 不要直接修改此数组来添加或移除粒子，应使用 `add` 和 `remove` 方法。添加粒子的顺序很重要：
    - 使用测试粒子时，活动粒子需在测试粒子之前添加。
    - 使用 WHFast 积分器时，中心天体需第一个添加。
    - 使用雅可比坐标时，粒子需从内到外添加（恒星、内行星、外行星）。
- `N` (整数): 当前模拟中的粒子总数（包括活动、测试和变分粒子）。
- `N_active` (整数): 模拟中的活动粒子数。只有活动粒子对引力计算有贡献。默认为 -1，表示所有粒子都是活动的。索引大于等于 `N_active` 的粒子被视为测试粒子。
  ```python
  sim = rebound.Simulation()
  sim.add(m=1)
  sim.add(m=1e-3, a=1)
  sim.add(m=0, a=2)
  sim.N_active = 2 # 前两个粒子是活动的，第三个是测试粒子
  ```
- `testparticle_type` (整数): 决定测试粒子的类型。
  - `0` (默认): 测试粒子不影响任何其他粒子。
  - `1`: 活动粒子会感受到测试粒子的引力（类似于 MERCURY 的小粒子）。
  测试粒子之间从不相互作用。
- `N_var` (整数): 变分粒子总数。默认为 0。
- `N_var_config` (整数): 变分粒子配置数。默认为 0。

**4. 碰撞 (Collisions)**

- `collision_resolve` (函数指针): 决定如何处理碰撞。默认为 NULL（硬球模型）。
- `track_energy_offset` (整数): 设置为 1 以跟踪碰撞和弹出过程中的能量变化（默认为 0）。
- `energy_offset` (浮点数): 由碰撞和弹出引起的能量偏移量。
- `collision_resolve_keep_sorted` (整数): 如果设置为 1，则在碰撞中移除粒子时保持粒子排序。
- `minimum_collision_velocity` (浮点数): 当使用硬球碰撞解析函数时，碰撞后两粒子间的速度至少为此值。默认为 0。
- `collisions_plog` (浮点数): 跟踪碰撞过程中的动量交换。
- `collisions_log_n` (长整型): 跟踪已发生的碰撞次数。
- `coefficient_of_restitution` (回调函数): 当发生硬球碰撞时调用此函数获取恢复系数。默认为 NULL，假定恢复系数为 1。

**5. 杂项 (Miscellaneous)**

- `status` (枚举): 模拟的当前状态。设置为 1 可在下一个时间步结束时强制正常退出。
- `exit_max_distance` (浮点数): 如果任何粒子离原点的距离超过此值，积分将停止。
- `exit_min_distance` (浮点数): 如果任意两个粒子之间的距离小于此值，积分将停止。
- `usleep` (浮点数): 每个时间步后休眠的微秒数。可用于减慢模拟以进行可视化。
- `N_ghost_x`, `N_ghost_y`, `N_ghost_z` (整数): x, y, z 方向的鬼影盒子数量。
- `rand_seed` (无符号整数): 随机数生成器的种子。会自动初始化，但也可手动设置以获得可复现的结果。

**6. 模块选择 (Module selection)**

以下变量决定了选择哪些模块：
- `visualization` (枚举)
- `collision` (枚举)
- `integrator` (枚举)
- `boundary` (枚举)
- `gravity` (枚举)

**7. 积分器配置 (Integrator configuration)**

每个积分器都有其特定的配置结构，例如：
- `ri_sei`
- `ri_whfast`
- `ri_saba`
- `ri_ias15`
- `ri_mercurius`
- `ri_janus`
- `ri_eos`

#### `Simulation` 对象的方法

**1. 时间步进**

- `sim.integrate(time)`: 积分直到模拟时间达到 `time`。
  ```python
  sim.integrate(100.) # 积分直到 t=100.
  ```
  使用 `exact_finish_time=0` 参数可以避免在最后一步减小时间步长，而是稍微过冲。
  ```python
  sim.integrate(100., exact_finish_time=0) # 积分到 t=100 或稍远一点
  ```
- `sim.stop()`: 停止当前的积分。
- `sim.step()`: 将模拟推进一个时间步。
- `sim.steps(N)`: 将模拟推进 `N` 个时间步。
- `sim.synchronize()`: 手动同步模拟。某些积分器在 `safe_mode` 关闭时会进行优化，导致时间步未完全完成，此时需要同步。

**2. 保存与加载**

- `sim.save_to_file("snapshot.bin")`: 将当前模拟状态保存到二进制文件。
- `sim2 = rebound.Simulation("snapshot.bin")`: 从二进制文件加载模拟。

**3. 诊断**

- `sim.energy()`: 计算模拟的总能量（动能+势能）。
- `sim.angular_momentum()`: 计算模拟的总角动量，返回 `(Lx, Ly, Lz)`。
- `sim.com()`: 计算模拟的质心，返回一个代表质心的粒子对象。

**4. 参考系变换**

- `sim.move_to_hel()`: 将模拟移动到日心参考系（索引为 0 的粒子位于原点）。
- `sim.move_to_com()`: 将模拟移动到质心参考系（质心位于原点）。
  **重要**: 建议在设置完所有粒子后调用 `move_to_com()`，以避免因质心漂移导致的长期积分中的浮点精度误差。

**5. 操作符**

- **复制**: `r_copy = r.copy()` 创建一个模拟的深拷贝。
  **信息**: 函数指针需要手动重置。
- **算术**: `r1 -= r2` 或 `r1 += r2`。对两个模拟中对应的每个粒子进行逐元素的位置、速度和质量的减法或加法。两个模拟的粒子数必须相同。
- **比较**: `if r1 == r2:` 检查两个模拟是否相等。

### `Particle` 对象

#### 结构和访问

`rebound.Particle` 类包含以下可直接操作的变量：
- `m` (浮点数): 质量
- `r` (浮点数): 物理半径
- `x`, `y`, `z`, `vx`, `vy`, `vz` (浮点数): 位置和速度坐标
- `hash` (32位无符号整数): 用于识别粒子的整数或哈希值

**创建独立粒子**:
```python
p = rebound.Particle(m=1., x=0., vy=0.)
```

**访问模拟中的粒子**:
- **通过索引**:
  ```python
  sim = rebound.Simulation()
  # ... 添加粒子 ...
  sim.particles[0].x = 1
  ```
- **通过哈希值**:
  ```python
  sim = rebound.Simulation()
  sim.add(m=1., hash="star")
  sim.add(a=1., hash="planet1")
  p = sim.particles["planet1"]
  ```

#### 添加粒子

- **便利函数 (最简单的方式)**:
  ```python
  sim = rebound.Simulation()
  sim.add(m=1)                 # 在原点添加质量为1的恒星
  sim.add(m=1e-3, a=1.)        # 添加行星，质量1e-3，半长轴1
  sim.add(m=1e-3, a=2., e=0.1) # 添加行星，质量1e-3，半长轴2，偏心率0.1
  sim.add(m=1e-6, x=1., vy=1.) # 使用笛卡尔坐标添加粒子
  ```
- **手动创建并添加**:
  ```python
  sim = rebound.Simulation()
  primary = rebound.Particle(m=1., x=1.)
  sim.add(primary)
  # 使用轨道参数创建，需要传入 sim 和 primary
  planet = rebound.Particle(simulation=sim, primary=primary, m=1e-3, a=1., e=0.1)
  sim.add(planet)
  ```
- **太阳系数据**:
  ```python
  sim = rebound.Simulation()
  rebound.data.add_solar_system(sim) # 添加太阳系
  rebound.data.add_outer_solar_system(sim) # 添加外太阳系
  ```
  **注意**: 这些初始条件主要用于测试，可能不够精确，不应用于详细的动力学研究。

#### 移除粒子

- **移除所有粒子**:
  ```python
  del sim.particles
  ```
- **按索引移除**:
  ```python
  sim.remove(1) # 移除索引为 1 的粒子
  ```  `remove` 方法接受一个可选参数 `keep_sorted` (默认为 `True`)。
- **按哈希值移除**:
  ```python
  sim.remove(hash="planet1")
  ```

#### 粒子操作符

- **乘法**: `sim.particles[0] *= 2.` (位置、速度和质量都乘以 2)
- **加/减法**: `p1 += p2` (将 p2 的位置、速度和质量加到 p1 上)
- **创建新粒子**:
  ```python
  p3 = p1 + p2
  p5 = 2. * p1
  ```
- **计算距离**:
  ```python
  distance = p1 ** p2
  ```
- **提示**: 粒子操作符在初始化时非常有用。
  ```python
  sim = rebound.Simulation()
  sim.add(m=1)        # 恒星
  p1 = sim.add(a=1)   # 行星 1
  p2 = sim.add(a=2)   # 行星 2
  p_middle = (p1+p2)/2. # 位于两行星正中间的新粒子
  ```

### 轨道根数

- **获取轨道根数**:
  - 单个粒子: `o = sim.particles[1].orbit(primary=sim.particles[0])`
  - 所有粒子: `orbits = sim.orbits()`
  如果不提供 `primary`，则使用雅可比坐标。
- **轨道根数对象 `o` 的属性**:
  - `d`: 径向距离
  - `v`: 相对速度
  - `h`: 比角动量
  - `P`: 轨道周期
  - `n`: 平均运动
  - `a`: 半长轴
  - `e`: 偏心率
  - `inc`: 轨道倾角
  - `Omega`: 升交点黄经
  - `omega`: 近心点幅角
  - `pomega`: 近心点黄经
  - `f`: 真近点角
  - `M`: 平近点角
  - `l`: 平黄经
  - `theta`: 真黄经
  - `T`: 过近心点时刻
  - `rhill`: 希尔半径
  **重要**: 所有角度单位均为弧度。
- **转换函数**:
  - `rebound.M_to_f(e, M)`: 从平近点角到真近点角
  - `rebound.E_to_f(e, E)`: 从偏近点角到真近点角
  - `rebound.M_to_E(e, M)`: 从平近点角到偏近点角

### 模块详解

#### 积分器 (Integrators)

- **IAS15** (默认): 高阶非辛自适应步长积分器。
  - 选择: `sim.integrator = "ias15"`
  - 配置 (`sim.ri_ias15`):
    - `epsilon` (浮点数): 控制精度的参数，默认为 1e-9。设为 0 关闭自适应步长。
      **重要**: IAS15 是 15 阶积分器，改变 `epsilon` 对精度的影响极大，不建议为了速度而牺牲精度。
    - `min_dt` (浮点数): 允许的最小时间步长，默认为 0。
    - `adaptive_mode` (无符号整数): 决定自适应步长选择方式。默认为 2。

- **WHFast**: 辛 Wisdom-Holman 积分器，适用于有主导中心天体的系统。
  - 选择: `sim.integrator = "whfast"`
  - 必须设置时间步长: `sim.dt = 0.1`
  - 配置 (`sim.ri_whfast`):
    - `corrector` (无符号整数): 开启一阶辛校正器，可选 0 (关闭), 11, 17 等阶数。
    - `corrector2` (无符号整数): 开启二阶辛校正器 (0 或 1)。
    - `kernel` (字符串): 选择核函数，可选 `"default"`, `"modifiedkick"`, `"composition"`, `"lazy"`。
    - `coordinates` (字符串): 选择坐标系，可选 `"jacobi"` (默认), `"democraticheliocentric"`, `"whds"`, `"barycentric"`。
    - `safe_mode` (无符号整数): 默认为 1。设为 0 可提速，但需手动同步。

- **Gragg-Bulirsch-Stoer (BS)**: 自适应积分器，适用于中等精度的短时积分。
  - 选择: `sim.integrator = "BS"`
  - 配置 (`sim.ri_bs`):
    - `eps_rel`, `eps_abs` (浮点数): 相对和绝对容差。
    - `min_dt`, `max_dt` (浮点数): 限制最小和最大时间步长。
  - **自定义 ODE**: BS 可用于积分任意常微分方程。
    ```python
    import numpy as np
    def derivatives(ode, yDot, y, t):
        # ... 定义导数 ...
        pass
    sim = rebound.Simulation()
    # ...
    ho = sim.create_ode(length=2)
    ho.derivatives = derivatives
    ho.y[0] = 1.0
    ```

- **Mercurius**: 混合辛积分器，远距离用 WHFast，近距离平滑切换到 IAS15。
  - 选择: `sim.integrator = "mercurius"`
  - 配置 (`sim.ri_mercurius`):
    - `r_crit_hill` (浮点数): 临界切换半径，单位为希尔半径，默认为 3。
    - `L` (字符串): 切换函数，可选 `"mercury"`, `"C4"`, `"C5"`, `"infinity"`。

- **TRACE**: 混合时间可逆积分器，远距离用 WHFast，近距离时间可逆地切换到 BS 或 IAS15。
  - 选择: `sim.integrator = "trace"`
  - 配置 (`sim.ri_trace`):
    - `r_crit_hill` (浮点数): 临界切换半径，默认为 4。
    - `S` (字符串): 非中心天体间近距离接触的切换函数，默认为 `"default"`。
    - `S_peri` (字符串): 与中心天体近距离接触的切换函数，可选 `"default"` 或 `"none"`。
    - `peri_crit_eta` (浮点数): 近心点接近的判据，默认为 1。
    - `peri_mode` (字符串): 近心点积分模式，可选 `"PARTIAL_BS"`, `"FULL_BS"`, `"FULL_IAS15"`。

- **SABA**: 辛积分器家族。
  - 选择: `sim.integrator = "saba"` 或 `sim.integrator = "SABA(10,6,4)"`
  - 配置 (`sim.ri_saba`):
    - `type` (字符串): 选择具体类型，如 `"(10,6,4)"` (默认)。

- **JANUS**: 逐位时间可逆的高阶辛积分器。
  - 选择: `sim.integrator = "janus"`
  - 配置 (`sim.ri_janus`):
    - `scale_pos`, `scale_vel` (浮点数): 位置和速度的尺度因子。
    - `order` (无符号整数): 方案的阶数，默认为 6。

- **EOS**: 嵌入式算子分裂方法。
  - 选择: `sim.integrator = "eos"`
  - 配置 (`sim.ri_eos`):
    - `phi0`, `phi1` (字符串): 内外算子分裂方案，如 `"LF4"`。
    - `n` (无符号整数): 子时间步数，默认为 2。

- **Leapfrog**: 标准二阶辛蛙跳积分器。
  - 选择: `sim.integrator = "leapfrog"`

- **SEI**: 辛周转圆积分器，用于剪切片。
  - 选择: `sim.integrator = "sei"`
  - 配置 (`sim.ri_sei`):
    - `OMEGA` (浮点数): 周转/轨道频率。

- **None**: 不进行积分，粒子不移动。
  - 选择: `sim.integrator = "none"`

- **WHFast512**: 使用 AVX512 指令集加速的 WHFast 版本。
  - **重要**: 需要 CPU 支持 AVX512，并使用特定方式编译安装：
    ```bash
    export AVX512=1
    pip install rebound
    ```
  - 选择: `sim.integrator = "whfast512"`
  - **限制**:
    - 粒子数不能超过 9 (1 恒星 + 8 行星)。
    - G 必须为 1。
    - `safe_mode=0` 且 `exact_finish_time=0`。
    - 不支持变分粒子、测试粒子、附加力等。
    - 总是使用民主日心坐标。

#### 碰撞 (Collisions)

- **碰撞检测**: `sim.collision = "..."`
  - `"none"` (默认): 不检测。
  - `"direct"`: 直接暴力搜索，复杂度 O(N^2)。
    **重要**: 只在每个时间步结束后检查瞬时重叠，可能错过快速穿过的碰撞。
  - `"line"`: 暴力搜索，但检查时间步内的轨迹重叠（假设直线运动）。
  - `"tree"`: 使用八叉树，复杂度 O(N log N)，需要 `sim.configure_box()`。
  - `"linetree"`: 结合树和线性轨迹检查。

- **碰撞处理**: `sim.collision_resolve = "..."`
  - `"halt"` (默认): 停止积分并抛出 `Collision` 异常。
  - `"hardsphere"`: 硬球碰撞。需要设置恢复系数函数。
    ```python
    def coefficient_of_restitution_constant(r, v):
        return 0.5
    sim.coefficient_of_restitution = coefficient_of_restitution_constant
    sim.collision_resolve = "hardsphere"
    ```
  - `"merge"`: 合并两个碰撞粒子，保留索引较小的粒子。
  - **自定义函数**:
    ```python
    def my_resolve_function(sim_pointer, collision):
        sim = sim_pointer.contents
        # ... 处理碰撞 ...
        return 0 # 0:不移除, 1:移除p1, 2:移除p2, 3:移除两者
    sim.collision_resolve = my_resolve_function
    ```

#### 边界条件 (Boundary Conditions)

- `sim.boundary = "..."`
  - `"none"` (默认): 无边界。
  - `"open"`: 开放边界，粒子离开盒子后被移除。需要 `sim.configure_box()`。
  - `"periodic"`: 周期性边界。需要 `sim.configure_box()`。
  - `"shear"`: 剪切周期性边界，用于模拟盘片。需要 `sim.configure_box()` 和设置 `sim.OMEGA`。
- **鬼影盒子 (Ghost boxes)**:
  `sim.N_ghost_x = 2` 等，用于周期性和剪切边界，以计算跨边界的力和碰撞。

#### 引力求解器 (Gravity Solvers)

- `sim.gravity = "..."`
  - `"basic"` (默认): 直接求和，O(N^2)。
  - `"compensated"`: 使用补偿求和以减少舍入误差的直接求和。
  - `"tree"`: 使用八叉树，O(N log N)。
  - `"jacobi"`: 直接求和，包含某些辛积分器所需的特殊项。
  - `"none"`: 不计算引力。

### 可视化

REBOUND 内置一个 web 服务器，通过浏览器进行实时 3D 可视化。

- **启动服务器**:
  ```python
  sim = rebound.Simulation()
  sim.start_server(port=1234)
  ```
  然后在浏览器中打开 `http://localhost:1234/`。
- **安全警告**:
  此端口上的流量未加密。请勿将此端口暴露于公网。
- **Jupyter 小部件**:
  ```python
  sim.widget(size=(400,400))
  ```
  这会自动启动服务器并在 notebook 中显示一个 iframe。
- **远程服务器**:
  使用 SSH 隧道转发端口：
  `ssh username@remotecomputer -L 1234:localhost:1234`
- **资源考虑**:
  可视化会消耗大量 CPU 资源。如果不再需要，请停止服务器。

### 单位

- **默认单位 (G=1)**:
  默认情况下，`G=1`。这是一个无标度系统。用户需要根据问题来解释单位。例如，对于日地系统，若 `M=1` 代表太阳质量，`a=1` 代表 AU，则时间单位为 `1 年 / (2*pi)`。
- **更改 G**:
  可以设置为 SI 单位等。
  ```python
  sim = rebound.Simulation()
  sim.G = 6.6743e-11 # m^3 / kg s^2
  ```
  设置后，所有长度、时间、质量单位都需与 G 的单位系统保持一致。
- **Python 便利函数**:
  Python 版本提供了一些便利函数来处理单位转换。

### `Simulationarchive`

`Simulationarchive` 是一个将多个模拟快照存储在单个二进制文件中的格式。

- **创建快照**:
  - 手动: `sim.save_to_file("archive.bin")` (默认行为是追加)
  - 自动 (按时间间隔): `sim.save_to_file("archive.bin", interval=10.)`
  - 自动 (按步数): `sim.save_to_file("archive.bin", step=100)`
    **信息**: 按步数保存通常比按时间间隔更可靠，可避免浮点精度问题。
  - 自动 (按墙上时间): `sim.save_to_file("archive.bin", walltime=120)` (单位：秒)
- **读取快照**:
  ```python
  # 读取第 12 个快照
  sim = rebound.Simulation("archive.bin", snapshot=12)
  # 读取最后一个快照 (默认行为)
  sim = rebound.Simulation("archive.bin")
  ```

### 混沌指标

- **初始化**:
  在添加完所有粒子后，初始化变分粒子和 MEGNO。
  ```python
  sim.init_megno()
  ```
  为了可复现性，可以指定种子：
  ```python
  sim.init_megno(seed=0)
  ```
- **访问指标**:
  ```python
  megno_value = sim.calculate_megno()
  lcn_value = sim.lyapunov() # 最大李雅普诺夫特征数
  ```
- **变分方程重缩放**:
  **重要**: REBOUND 会自动重缩放一阶变分方程。如果你需要变分粒子的真实值，必须考虑 `lrescale` 变量（所有重缩放因子的自然对数之和）。
  ```python
  vc = sim.var_config[0]
  # 变分粒子 x 坐标的对数值
  log_x = vc.particles[0].x + vc.lrescale
  ```

### 其他工具

- **模 2π**:
  `rebound.mod2pi(angle)` 返回 `angle` 对 2π 取模的结果，范围在 `[-pi, pi]`。
- **哈希函数**:
  `rebound.hash("string")` 将字符串转换为一个整数哈希值。