# Astropy Python API 知识库

## 0. 约定

* 别名：`from astropy import units as u, constants as const`
* 语义：下文“式样”=常用调用模板；“要点”=易错或依赖；示例最短可运行。

---

## 1. Units / Quantity / Constants

**式样**

* 创建量：`q=3*u.kpc`；数组：`q=np.array([1,2])*u.m`
* 换算：`q.to(u.lyr)`；角度：`(30*u.deg).to(u.rad)`
* 复合单位：`(10*u.m/u.s)`；单位乘除幂：`u.m**2/u.s`
* 去单位值：`q.value`；取单位：`q.unit`
* 等价关系：`q.to(u.Hz, u.spectral())`（频率↔波长等）
* 常数：`const.c`、`const.G`（含单位，可与Quantity运算）
  **要点**
* 与numpy广播：`(np.arange(3)*u.m + 1*u.m).to(u.cm)`
* 优先使用Quantity参与运算，避免纯float丢单位
  **示例**

```python
from astropy import units as u, constants as const
L=(3*u.kpc).to(u.lyr)
v=(500*u.km/u.s).to(u.m/u.s)
E=const.h*(500*u.THz)
nu=(500*u.nm).to(u.THz, u.spectral())
```

---

## 2. Time

**式样**

* 构造：`from astropy.time import Time; t=Time('2020-01-01T00:00:00', scale='utc')`
* 标度切换：`t.tai`/`t.ut1`/`t.tdb`；格式：`t.isot`/`t.mjd`/`t.jd`
* 数组：`Time(['2020-01-01','2020-01-02'], scale='utc')`
* 运算：`t2=t+3*u.day; dt=t2-t`（返回TimeDelta）
* 转值：`t.to_value('unix')`；从值：`Time(val, format='unix', scale='utc')`
  **要点**
* 不同`scale`的差值需显式转换到同一scale
* 高精度运算建议用`tdb`/`tt`并设置必要历元参数
  **示例**

```python
from astropy.time import Time
from astropy import units as u
t=Time('2020-01-01T00:00:00', scale='utc')
(t.tai.isot, (t+1*u.day).mjd)
```

---

## 3. Coordinates / SkyCoord

**式样**

* 构造ICRS：`from astropy.coordinates import SkyCoord; c=SkyCoord('10h21m0s +41d12m0s', frame='icrs')`
* 角度输入：`SkyCoord(ra=10.5*u.deg, dec=41.2*u.deg, frame='icrs')`
* 常见框架：`icrs`、`fk5`(需equinox) 、`galactic`、`gcrs`、`geocentrictrueecliptic`等
* 变换：`c2=c.transform_to('galactic')`
* 批量：`SkyCoord(ra=arr*u.deg, dec=arr*u.deg, frame='icrs')`
* 角距：`c1.separation(c2)`；匹配：`idx,sep,flag=c1.match_to_catalog_sky(catalog)`
  **要点**
* 某些变换依赖太阳系历表（需`astropy.coordinates.solar_system_ephemeris`）
* `fk5`需`equinox`；`gcrs`常需观测时间`obstime`
  **示例**

```python
from astropy.coordinates import SkyCoord
from astropy import units as u
c=SkyCoord('10h21m0s +41d12m0s', frame='icrs')
(gal:=c.galactic).l.deg, gal.b.deg
c2=c.transform_to('fk5')
```

---

## 4. Tables（结构化表）

**式样**

* 构造：`from astropy.table import Table; t=Table({'a':[1,2],'b':[3,4]})`
* 列操作：`t['c']=t['a']+t['b']`；筛选：`t[t['a']>1]`
* I/O统一入口：`t.write('x.fits')`，`Table.read('x.fits')`
* 与Quantity：`Table({'x':[1,2]*u.m})`保留单位
* 与Pandas互转：`t.to_pandas()`/`Table.from_pandas(df)`
  **要点**
* 大CSV读写优先使用`Table.read('x.csv')`高性能后端（可能需pyarrow）
  **示例**

```python
from astropy.table import Table
from astropy import units as u
t=Table({'a':[1,2],'b':[3,4]*u.m})
t.write('t.fits', overwrite=True)
```

---

## 5. File I/O（fits, ascii）

**FITS**

* 读：`from astropy.io import fits; hdul=fits.open('img.fits'); data=hdul[0].data; hdr=hdul[0].header`
* 写：`hdu=fits.PrimaryHDU(data, header=hdr); hdu.writeto('out.fits', overwrite=True)`
* 更新：`with fits.open('x.fits', mode='update') as hdul: hdul[0].header['KEY']=1; hdul.flush()`
  **ASCII/CSV**
* 读：`from astropy.io import ascii; tab=ascii.read('x.csv')`
* 写：`ascii.write(tab,'x.csv', overwrite=True)`
  **要点**
* 优先`Table.read/write`统一接口；FITS大文件用内存映射`memmap=True`
  **示例**

```python
from astropy.io import fits, ascii
hdul=fits.open('img.fits', memmap=True)
ascii.write({'a':[1,2],'b':[3,4]}, 'x.csv', overwrite=True)
```

---

## 6. WCS / WCSAxes

**式样**

* 从头建：`from astropy.wcs import WCS; w=WCS(hdr)` 或 `WCS(naxis=2); w.wcs.crpix=[..]; w.wcs.cdelt=[..]; w.wcs.crval=[..]; w.wcs.ctype=['RA---TAN','DEC--TAN']`
* 像素↔天球：`w.pixel_to_world(x,y)`；`w.world_to_pixel(coord)`
* 可视化：`from astropy.visualization import wcsaxes`（与matplotlib集成）
  **要点**
* SIP/查找表畸变通常二维；高维WCS仅核心坐标支持
* Matplotlib绘图需使用`projection=w`创建坐标轴
  **示例**

```python
from astropy.wcs import WCS
from astropy.io import fits
h=fits.open('img.fits')[0].header
w=WCS(h)
```

---

## 7. Modeling / Fitting

**式样**

* 模型：`from astropy.modeling import models; g=models.Gaussian1D(amplitude, mean, stddev)`
* 拟合器：`from astropy.modeling import fitting; fit=fitting.LevMarLSQFitter()`
* 拟合：`m_fit=fit(g, x, y)`；评估：`y_pred=m_fit(x)`
* 复合模型：`m=models.Linear1D()+models.Gaussian1D(...)`
  **要点**
* `LevMarLSQFitter`需SciPy；非有限值可`filter_non_finite=True`
* 约束：参数`.bounds`/`.fixed`/`.tied`
  **示例**

```python
from astropy.modeling import models, fitting
import numpy as np
x=np.linspace(-5,5,101)
y=np.exp(-(x-1)**2/2)
g=models.Gaussian1D(1,1,1)
fit=fitting.LevMarLSQFitter(); gf=fit(g,x,y)
```

---

## 8. Cosmology

**式样**

* 预设：`from astropy.cosmology import Planck18 as cosmo`
* 距离：`cosmo.luminosity_distance(z)`；年龄：`cosmo.age(z)`
* 求z：`from astropy.cosmology import z_at_value; z_at_value(cosmo.luminosity_distance, 1*u.Gpc)`
  **要点**
* Planck18为FlatΛCDM实参；单位为`Quantity`
  **示例**

```python
from astropy.cosmology import Planck18 as cosmo, z_at_value
from astropy import units as u
D=cosmo.luminosity_distance(0.5)
z=z_at_value(cosmo.luminosity_distance, 1*u.Gpc)
```

---

## 9. Visualization（最少依赖）

**式样**

* 简化归一：`from astropy.visualization import simple_norm; norm=simple_norm(data,'sqrt')`
* WCSAxes：`ax=plt.subplot(projection=w); ax.imshow(data, origin='lower'); ax.coords[0].set_axislabel('RA'); ax.coords[1].set_axislabel('Dec')`
  **要点**
* `simple_norm`仅常见stretch；更复杂用`ImageNormalize`
  **示例**

```python
from astropy.visualization import simple_norm
norm=simple_norm(data,'log')
```

---

## 10. Unified I/O（总入口）

**式样**

* 表：`Table.read('x.fits'); Table.read('x.csv')`；`write(..., overwrite=True)`
* 图片：`from astropy.nddata import CCDData; CCDData.read('x.fits')`
  **要点**
* 统一接口比直接子包I/O更稳健（可换后端）

---

## 11. 组合范式（端到端最短示例）

**FITS→WCS→SkyCoord→像素**

```python
from astropy.io import fits
from astropy.wcs import WCS
from astropy.coordinates import SkyCoord
from astropy import units as u
hdu=fits.open('img.fits')[0]
w=WCS(hdu.header)
c=SkyCoord(10.684*u.deg, 41.269*u.deg, frame='icrs')
x,y=w.world_to_pixel(c)
```

**SkyCoord↔变换↔角距**

```python
from astropy.coordinates import SkyCoord
from astropy import units as u
c1=SkyCoord(ra=10*u.deg, dec=41*u.deg, frame='icrs')
sep=c1.separation(c1.galactic)
```

**Time标度/差值**

```python
from astropy.time import Time
from astropy import units as u
t=Time('2020-01-01T00:00:00', scale='utc')
dt=(t.tdb + 12*u.hour) - t.utc
```

**Quantity+常数+模型拟合**

```python
from astropy import units as u, constants as const
from astropy.modeling import models, fitting
import numpy as np
x=(np.linspace(400,700,50)*u.nm).to(u.THz, u.spectral()).value
y=np.exp(-0.5*((x-500)**2)/50**2)
fit=fitting.LevMarLSQFitter()
m=fit(models.Gaussian1D(1,500,50), x, y)
```

---

## 12. 常见陷阱摘要

* 单位缺失：确保物理量用`Quantity`封装
* 坐标变换：提供必要`obstime/equinox`和历表；批量用向量化`SkyCoord`
* 时间：scale/format混用导致误差，比较前请归一
* I/O：大CSV优先`Table.read`高性能后端；FITS需`overwrite=True`
* 可视化：WCSAxes必须`projection=w`；`origin='lower'`避免倒置

---

## 13. 速查键值（便于检索）

* units: Quantity to, equivalencies, spectral
* time: Time scale utc tai tdb, format isot mjd jd, TimeDelta
* coordinates: SkyCoord frame icrs fk5 galactic gcrs transform_to separation match_to_catalog_sky
* table: Table read write pandas
* io: fits open writeto header data ascii read write
* wcs: WCS pixel_to_world world_to_pixel SIP TAN
* modeling: Gaussian1D LevMarLSQFitter bounds fixed tied
* cosmology: Planck18 luminosity_distance age z_at_value
* viz: simple_norm WCSAxes

---

## 14. 最小依赖清单

* 基础：numpy
* 可选：scipy（建模拟合）; pyarrow（ASCII/CSV后端）

---

## 15. 版本与兼容（通用表述）

* 以上调用为Astropy 7.x稳定接口子集；低版本亦多兼容。