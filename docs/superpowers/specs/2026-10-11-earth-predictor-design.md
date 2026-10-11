# 未来地球引擎 v0 — 设计规格书

- **日期**：2026-10-11
- **状态**：设计已获用户逐节批准，本文档为实施依据
- **前置文档**：`docs/01-问题设计.md`（问题定义与模型分层）、`docs/02-本体初稿设计.md`（Earth Ontology v0.1 草案、53 方程与因果图）

---

## 1. 项目目标

构建「未来地球引擎」：一个可运行的地球环境演化模拟器。从当前地球状态与人类排放情景出发，计算 2026–2500 年温度、海平面、冰冻圈与地表状态的整体演化，以 3D 地球 + 时间轴形式呈现，支持城市级气候条件与淹没状态查询。

长期愿景遵循前置文档的三层架构：

```
Earth Ontology（世界是什么）→ Earth Model（世界怎么变化）→ Earth State（世界变成什么样）
```

### 1.1 本阶段（v0）交付物

1. **完整本体规格**：机器可读 YAML（变量表、方程表、因果图、参数表、情景表、数据源目录），每条目标注 `impl: v0/v1/v2/v3` 实现分级
2. **数据模型 + 精选数据集**：历史/情景时间序列 + 静态空间数据，全部静态打包
3. **V0 引擎**：0D 全球气候核心（碳循环 → 辐射强迫 → 两层海洋能量平衡 → 海平面四分解）+ 模式缩放降尺度
4. **前端**：3D 地球 + 时间轴拖动 + 城市面板 + `/api/simulate` 公开 API，部署 Vercel

### 1.2 验收哲学

**定量对标**：模型必须复现 1850–2024 历史观测，且 2100 年情景预测落在 IPCC AR6 评估区间内（详见 §7）。曲线形态正确但数值错误不算通过。

---

## 2. 已确认的关键决策

| 决策点 | 结论 |
|---|---|
| 交付物范围 | 设计规格 + 数据模型 + **可运行 V0 原型**（选项 B） |
| 技术栈 | TypeScript / Next.js App Router，部署 Vercel |
| 验收标准 | 定量：历史复现 + IPCC AR6 区间（选项 B） |
| 规格覆盖 | 完整本体 53 方程 + 实现分级标记（选项 A） |
| 代码组织 | pnpm monorepo，规格即数据（spec-as-data）（方案 B） |
| 前端形态 | 3D 地球 + 时间轴 + 城市面板（用户愿景修订，替代最小仪表盘） |

---

## 3. 系统架构

```
earth_change/
├── pnpm-workspace.yaml
├── package.json                 # 根脚本：gen:spec / calibrate / test / dev / build
├── docs/                        # 既有文档 + 本规格书
├── apps/web/                    # Next.js 应用（Vercel 部署单元）
│   ├── app/page.tsx             # 地球仪表盘
│   ├── app/api/simulate/route.ts
│   └── components/              # GlobeView / Timeline / ScenarioSelector / CityPanel / MetricsBar
├── packages/spec/               # ① 本体层：YAML 唯一事实源
│   ├── src/spec/*.yaml          # ontology / variables / equations / parameters / causal_graph / scenarios / datasets
│   ├── src/schema.ts            # zod 校验 schema
│   ├── src/generated/           # 生成的 TS 类型（提交入库）
│   └── src/index.ts             # 类型化加载器
├── packages/engine/             # ② 模型层：纯 TS 求解器（零框架依赖）
│   └── src/
│       ├── types.ts             # EarthState(v0) / SimResult
│       ├── registry.ts          # 方程 ID ↔ 实现绑定
│       ├── equations/           # forcing.ts / carbon.ts / ocean.ts / sealevel.ts / downscale.ts
│       ├── solver.ts            # RK4 步进器
│       ├── scenario.ts          # 情景驱动序列插值
│       └── calibrate.ts         # 历史校准 + Nelder-Mead
└── packages/data/               # ③ 数据层：精选数据集 + manifest + 加载器
    ├── datasets/historical/     # 排放 / CO₂ / 温度 / 海平面 / 自然强迫
    ├── datasets/scenarios/      # SSP 情景 JSON（延伸至 2500）
    ├── datasets/static/         # DEM / 升温模式 / 城市 / 基准气候
    ├── manifest.json
    └── src/loaders.ts
```

**依赖方向**：`web → engine → { spec, data }`，无循环。engine 不依赖 Next.js / 浏览器 API——这是可移植性要求（v1 的 WASM/Web Worker、平行 Python 对照实现都建立在此之上）。

---

## 4. 本体规格包 `packages/spec`

### 4.1 文件清单

| 文件 | 内容 | 规模 |
|---|---|---|
| `ontology.yaml` | 10 个域的层级结构（Atmosphere / Ocean / Cryosphere / Hydrosphere / Geosphere / Biosphere / Pedosphere / Human / Space-Solar / SurfaceState） | ~90 行 |
| `variables.yaml` | 每变量：id、中英文名、域、单位、是否空间/状态变量、drivers、affects、关联方程、时间尺度、数据源、`impl` | ~53 条 |
| `equations.yaml` | 每方程：id（eq_01–eq_53）、名称、LaTeX 公式、输入/输出变量、引用参数、`impl` | 53 条 |
| `parameters.yaml` | 符号、单位、默认值、范围、不确定性、文献来源 | ~60 条 |
| `causal_graph.yaml` | 因果边：source → target、机制、符号、方程引用、所属反馈回路（10 大回路） | ~100 条 |
| `scenarios.yaml` | SSP1-2.6 / SSP2-4.5 / SSP3-7.0 / SSP5-8.5 定义 | 4 条 |
| `datasets.yaml` | 数据源目录：提供方、URL、格式、许可、本地文件映射 | ~14 条 |

### 4.2 示例条目（形式）

```yaml
# variables.yaml
- id: atmosphere.co2
  name_en: Atmospheric CO2 Concentration
  name_zh: 大气二氧化碳浓度
  domain: atmosphere
  unit: ppm
  spatial: false
  state_variable: true
  drivers: [human.emissions, land.sink, ocean.sink]
  affects: [atmosphere.radiative_forcing]
  equations: [eq_15]
  timescale: { min: 1, typical: 10, max: 500 }
  data_source: datasets.historical.co2_concentration
  impl: v0
```

```yaml
# equations.yaml
- id: eq_07
  name: CO2 Radiative Forcing
  formula: "F_CO2 = 5.35 * ln(C / C0)"
  inputs: [atmosphere.co2]
  outputs: [atmosphere.radiative_forcing]
  parameters: [F2x_const, C0_ref]
  impl: v0
```

```yaml
# causal_graph.yaml
- source: atmosphere.temperature
  target: cryosphere.glacier_mass
  type: causal
  mechanism: melting
  sign: negative
  equation: eq_25
  loops: [loop_ice_albedo]
```

### 4.3 规格与代码绑定（防漂移机制）

1. 每个文件用 zod schema 校验，加载即报错（不合法的 YAML 无法进入构建）
2. `pnpm gen:spec` 从 YAML 生成 TS 字面量联合类型（如 `type VariableId = 'atmosphere.co2' | ...`）并**提交入库**
3. vitest 一致性测试三条规则：
   - YAML 中所有 `impl: v0` 的方程必须已在 registry 注册实现
   - registry 中不得存在 YAML 之外的孤儿实现
   - causal_graph / equations 中引用的所有 id 必须可解析

### 4.4 方程分级总表

| 级别 | 方程 | 内容 |
|---|---|---|
| **v0（21 条 → 24 条，2026-10-11 回填）** | 原 21 条 + eq_28, 29, 30（ADR-001：海冰/反照率/反馈为**诊断式**，注册但不接入 RHS） | 气候核心 + 海平面分解 + 城市级淹没/群系 + 降尺度 + 海冰诊断 |
| v1 | eq_01–05, 10, 19–24, 28–30 | 辐射/反照率显式诊断、水循环（降水/蒸发/土壤水/径流）、积雪、海冰-反照率反馈；eq_10 的单层形式在 v0 已由 eq_11/12 两层形式涵盖，v1 作为诊断式保留 |
| v2 | eq_18, 33–40 | 植被动态、火灾、冻土碳、完整碳循环 |
| v3 | eq_41–48 | 侵蚀、沉积、河流、海岸侵蚀、地貌演化（全网格版淹没/群系） |

---

## 5. 数据模型 `packages/data`

### 5.1 时间序列数据（`datasets/historical/`）

| 文件 | 内容 | 来源 / 许可 |
|---|---|---|
| `emissions_1750_2024.csv` | CO₂/CH₄/N₂O 化石+土地利用排放 | Global Carbon Project / CC-BY 4.0 |
| `co2_concentration_1765_2024.csv` | 观测 CO₂（冰芯 + Mauna Loa/Scripps） | NOAA GML / 公有领域 |
| `temperature_1850_2024.csv` | 全球温度异常（1850–1900 基准） | NASA GISTEMP v4 / 公有领域 |
| `sea_level_1880_2024.csv` | 验潮站 + 1993 起卫星高度计 | PSMSL + NASA / 免费使用需署名 |
| `forcing_natural.csv` | 列 year,ch4,n2o,f_other：火山/气溶胶/其他 ERF 合并列 + 历史 CH₄/N₂O 浓度锚点 | AR6 Table 7.8 量级锚点合成 |

### 5.2 情景数据（`datasets/scenarios/`）

`ssp126.json / ssp245.json / ssp370.json / ssp585.json`：各情景排放路径与浓度路径，2025–2500（延伸 SSP），含 CH₄/N₂O 浓度路径。

### 5.3 静态空间数据（`datasets/static/`）

| 文件 | 内容 | 来源 / 许可 | 体积 |
|---|---|---|---|
| `dem_0.1deg.png` | 全球高程 16 位 PNG 高度图（0.1°≈11km） | NOAA ETOPO 2022 / 公有领域 | ~8 MB |
| `warming_pattern_lat.csv` | 36 纬度带升温放大系数（GISTEMP 分带对全球均值回归得出） | NASA / 公有领域 | <10 KB |
| `cities_top2000.csv` | 城市：名称/国家/经纬度/人口/高程 | GeoNames / CC-BY 4.0 | ~200 KB |
| `baseline_climate.csv` | 网格年均 T/P 基准气候态 | WorldClim 2.1 / CC-BY-SA | ~5 MB |

> **v0 实际交付（2026-10-11 回填）**：DEM 网格层降级，底图用 NASA Blue Marble 纹理；城市实现为 GeoNames top500 + WorldClim 逐城基准气候（tbase/pbase 并入 `cities_top500.csv`），不再单设网格 `baseline_climate.csv`；纬度带实现为 8 带（GISTEMP ZonAnn 1960–2024 回归，南半球海洋带 amp=0.282 属真实结果）。淹没不做网格渲染，见 §8.2 偏差。

### 5.4 manifest 机制

`manifest.json` 记录每个数据集：来源 URL、引用方式、许可、抓取日期、文件校验和。加载器校验 manifest ↔ 实际文件，不一致 → 构建/测试失败。**所有数据静态打包进仓库**（总量 < 20 MB，Vercel 无持久化文件系统，此为必须决策）。

### 5.5 模拟输出契约（web ↔ engine 之间的版本化 JSON）

```jsonc
{
  "schemaVersion": 1,
  "modelVersion": "0.1.0",
  "scenario": "ssp245",
  "paramsFingerprint": "sha256:...",
  "years": [2026, 2027, "...", 2500],
  "metrics": {
    "tempAnomaly": [0.94, "..."],
    "co2": [424.1, "..."],
    "seaLevel": {
      "total": [0.03, "..."],
      "thermal": [...], "glacier": [...],
      "iceSheet": [...], "landWater": [...]
    }
  }
}
```

### 5.6 v1+ 网格演进设计

`variables.yaml` 通过 `spatial: true` + 网格定义（分辨率、坐标索引）预留 2D 演进；EarthState 定义为 `X(t) = { [variableId]: number | GridField }`——0D → 2D 演进时数据模型不推翻。**2026-10-11 回填**：首个 2D 能力已落地——区域降水格点着色（WorldClim 5' 年降水纹理 shader，F12）与高程纹理淹没（5'，F05），均为「格点基准态 × 全场诊断缩放」模式，格点状态向量积分留 v2。

---

## 6. V0 方程组 `packages/engine`

### 6.1 因果链

```
排放(数据/情景) ──→ 碳循环(eq_15~17) ──→ CO₂ ─┐
                                              ├→ 辐射强迫(eq_07~09) ─┐
自然强迫(火山/太阳/气溶胶，数据) ───────────────────────────────┤
                                                                    ↓
  表面温度 T_s ←── 两层海洋能量平衡(eq_11,12) ── 净强迫 F ─────────┘
       │                  │
       ↓                  ↓
  冰川质量平衡          海洋热含量 OHC(eq_13)
  (eq_25,26)            热膨胀(eq_14)
  冰盖简化(eq_27)
       └───────┬────────┘
               ↓
  海平面 = 热膨胀+冰川+冰盖+陆地水 (eq_31,32)
               ↓
  降尺度(eq_51~53)：城市 ΔT / 生物群系 / 淹没判定
```

### 6.2 关键建模决策

- **温度核心 = 两层海洋能量平衡模型**（Geoffroy et al. 2013 形式，IPCC AR6 简单气候模型同款）：
  `Cs·dT_s/dt = F − λ·T_s − γ(T_s − T_d)`；`Cd·dT_d/dt = γ(T_s − T_d)`。
  表层=大气+混合层，深层=深海。自然产生「大气快、深海慢」的多年代际响应，是复现历史曲线的关键。
- **CO₂ 完整建模排放→浓度**（一阶碳循环：陆地汇含 CO₂ 施肥 β，海洋汇为线性缓冲）；**CH₄/N₂O 浓度直接采用观测/情景路径**，强迫用 AR6 简化公式。
- **冰川**：全球聚合箱式模型 + 度日融化（eq_25/26）；**冰盖**：格陵兰 SMB 二次敏感度（先验对齐当前 ~0.8mm/yr 实际贡献）+ 南极幂律项（eq_27）；**陆地水**：情景常数。
- **数值方法**：RK4，Δt = 1 年（检测不稳定自动减半子步）；NaN 守卫；**纯确定性**（无随机数，蒙特卡洛属 v1）。
- **降尺度**：`ΔT(城市,t) = ΔT_global(t) × Π(纬度带)`（Pattern Scaling，IPCC AR6 使用的标准技术）；降水 `P = P₀×(1+0.02×ΔT_global)`（v0 仅全球标量，区域格局属 v1）；淹没判定 `城市高程 ≤ SLR(t)`。

### 6.3 V0 状态向量（~10 个分量）

`X = [ C(CO₂), T_s, T_d, M_g(冰川), M_i_Gr, M_i_Ant, S_th, S_gl, S_ice, S_lw ]`

### 6.4 引擎目录

见 §3 架构图；每条方程一个纯函数，按域分文件注册进 `registry.ts`。

---

## 7. 校准与验收

### 7.1 可调参数（θ ≈ 12 个，先验范围来自文献，录入 `parameters.yaml`）

λ（反馈参数，等价 ECS 2–5°C）、γ（海洋热交换）、Cs/Cd（热容量）、β（CO₂ 施肥）、k（海洋碳吸收）、冰川度日因子、冰盖敏感度、α（热膨胀系数）。

### 7.2 校准流程

1. 历史运行 1850→2024，由 GCP 观测排放驱动
2. 对观测目标（CO₂/温度/海平面）最小化——自实现确定性 Nelder-Mead（~100 行，无重依赖）
3. 校准产物 `packages/engine/params.json`（参数 + 数据版本 + 校准日期）**提交入库**，`pnpm calibrate` 一键复现
4. 气候阶段附加 TCR（~1.9°C）与 ECS（~3.1°C）解析约束（两层 EBM：TCR=F₂ₓ/(λ+γ)，ECS=F₂ₓ/λ，AR6 评估值）——仅拟合历史曲线会导致 G1 与 G4 冲突

### 7.3 五道验收门（自动化 vitest 黄金测试，CI 门禁）

| 门 | 判据 |
|---|---|
| G1 历史温度 | \|ΔT_model(2024) − 1.4°C\| < 0.2°C，且 1980–2024 RMSE < 0.2°C |
| G2 历史CO₂ | \|C_model(2024) − 424ppm\| < 5ppm，1960–2024 累计增长误差 < 10% |
| G3 历史海平面 | \|S_model(2024) − 0.23m\| < 0.07m（自 1900 起算） |
| G4 未来情景 | 2100 年四情景 ΔT 均落在 AR6 很可能区间：SSP1-2.6 1.3~2.4 / SSP2-4.5 2.1~3.5 / SSP3-7.0 2.8~4.6 / SSP5-8.5 3.3~5.7°C；软目标：与最佳估计 1.8/2.7/3.6/4.4°C 偏差 < 0.7°C |
| G5 物理健全性 | 无 NaN；碳质量守恒闭合（排放 ≈ 大气增量+陆汇+海汇，残差 < 1%）；输出逐位确定 |

G4 通过而 G1–G3 不通过 = 「蒙对答案」，故历史门为前置必要条件。

---

## 8. 应用与 API `apps/web`

### 8.1 页面布局

```
┌────────────────────────────────────────────────┐
│  [SSP1-2.6 ▾]  ΔT +2.7°C  CO₂ 540ppm  SLR +0.6m │ ← MetricsBar（随 t 实时）
├────────────────────────────────────────────────┤
│              🌍 3D 地球                          │
│    温度色斑层 / GPU 淹没 shader 层 / 城市点层      │
├────────────────────────────────────────────────┤
│  2026 ●─────────────────┬───────────── 2500     │ ← Timeline
│                       t=2147                     │
└────────────────────────────────────────────────┘
  点击城市 → CityPanel：ΔT / 未来年均温 / 群系迁移 / 淹没状态
```

### 8.2 渲染分层（react-globe.gl + 自定义 Three.js shader）

| 层 | 实现 |
|---|---|
| 底图 | NASA Blue Marble 纹理 |
| 温度色斑 | pattern scaling 网格 → 着色多边形/点云 |
| 淹没 | 自定义 shader 对高度图纹理逐像素比较 `elevation < SLR(t)`，GPU 实时 |
| 城市点 | 2000 城市标记，点击弹出 CityPanel |

> **v0 偏差回填（2026-10-11）**：淹没 shader 层已实现（原降级项提前交付）——地球材质注入自定义 shader，采样全球高程纹理（WorldClim 2.1 10 角分 ≈18km，源 ETOPO，RGB 打包 uint16，`datasets/static/elevation_10min.png`），高程 ∈ (0, SLR] 的陆地实时渲染为水色，SLR uniform 随时间轴拖动更新；高程数据未含 bathymetry，海洋保持底图原色。分辨率低于规格的 0.1°（NOAA 直链不可达，改用已验证可达的 WorldClim 源）；城市规模为 top500（GeoNames），非 2000。

### 8.3 交互性能模型

页面加载时客户端跑一次选定情景（毫秒级）→ 缓存逐年状态 → 拖动时间轴 = 插值 + 更新 shader uniform，**零计算纯渲染**，目标 60fps。切换情景重跑模拟 < 100ms。

### 8.4 `/api/simulate` 契约

- `GET /api/simulate?scenario=ssp245&horizon=2500`；zod 校验（非法 → 400）
- 返回 §5.5 版本化 SimResult；输出确定性 → `Cache-Control: immutable`

### 8.5 错误处理

数据 manifest 构建期校验；引擎 NaN 守卫（触发则截断并标注）；API 参数校验；UI 错误边界 + 重试。

---

## 9. 测试与 CI

| 层 | 内容 |
|---|---|
| 方程单测 | 解析校验点：CO₂ 倍增 F = 5.35·ln2 ≈ 3.71 W/m²、ECS = F₂ₓ/λ、热膨胀符号等 |
| 规格一致性 | §4.3 三条规则 |
| 黄金测试 | G1–G5 验收门（校准参数锁定在库） |
| 数据测试 | manifest 校验和、年份序列无缺口、值域合理 |
| API 测试 | 路由参数合法/非法、schema 版本字段 |
| CI | GitHub Actions：`pnpm install → gen:spec → typecheck → test → build`；main 分支自动部署 Vercel |

确定性输出保证测试不 flaky。E2E（Playwright）不属 v0（记入路线图）。

---

## 10. 版本路线图

| 版本 | 内容 | 对应方程 |
|---|---|---|
| **v0（本次）** | 0D 气候核心 + SLR 四分解 + 地球时间轴 UI + 城市降尺度面板 | 21 条 |
| v1 | 蒙特卡洛不确定性（概率区间 UI）；2D 模式场（海冰范围、植被图着色、区域降水）；多分辨率地形；E2E 测试 | eq_01–05, 28–30 |
| v2 | 冻土碳反馈、火灾、植被动态、海洋碳循环细化 → 完整 ESM-lite | eq_18, 33–40 |
| v3 | 河流/侵蚀/沉积/海岸线/三角洲地貌演化，「未来地球」全形态 | eq_41–48 |

---

## 11. 非目标（v0 明确不做）

- 大气 Navier–Stokes、云微物理、ENSO、台风路径
- 物种级生态、冰川流变、地幔/板块/地震/火山内部动力学
- 2D 网格求解、海冰范围动态、植被地图着色、区域降水格局（→ v1）
- 蒙特卡洛不确定性（→ v1）、E2E 测试（→ v1）
- 数据在线抓取管道（数据静态打包，更新靠手动重抓 + manifest 版本化）

---

## 12. 风险与对策

| 风险 | 对策 |
|---|---|
| 0.1° DEM 淹没视觉粗糙 | 城市面板用 GeoNames 高程给点级精确判定；视觉精度限制在 UI 明示；v1 多分辨率地形 |
| 纬度模式缩放精度有限 | 定位为「大概」量级（用户原话）；v1 升级 2D 模式场 |
| 校准不收敛 | 参数先验范围约束（ECS 2–5°C 文献锚点）；Nelder-Mead 多起点重启 |
| Vercel 函数限制 | 模拟毫秒级且主要在客户端运行，实际无风险 |
