# 🌍 未来地球引擎（Future Earth Engine）

5–500 年地球环境演化模拟器：从人类排放情景出发，计算温度、海平面、冰冻圈与地表状态的耦合演化，以 3D 地球 + 时间轴 + 里程碑事件呈现，支持城市级查询、情景实验、影响评估与不确定性分析。

**当前版本 v4.1** — 已交付 v0.1 → v4.1 共 8 个版本，53 方程全部实现，270 单元测试 + 16 E2E 全绿。

## 功能总览

### 🖥️ 3D 地球仪表盘

- **2.5° 格点温度场**：Pattern Scaling × 陆海差异着色（与 Colorbar 图例同源），实时随时间轴更新
- **淹没模拟**：全球高程纹理 GPU shader 逐像素渲染「高程 < 海平面」的陆地，海岸线呼吸脉冲效果
- **城市点层**：500 城市标记（大小 ∝ √人口），点击弹出 CityPanel（本地升温 / 年均温 / 降水 / 群系 / 淹没判定）
- **降水 / 卫星底图 / 大气辉光** 图层开关
- **时间轴拖动**：2026–2500，里程碑事件通知卡片自动弹出

### 📊 分析抽屉（10 个 tab）

| Tab | 功能 |
|---|---|
| 大事记 | 里程碑时间线——温度阈值 / 海平面 / 海冰 / 城市淹没 / pH 事件，点击跳转年份 |
| 时间序列 | 温度 / CO₂ / 海平面 / 冻土 / 植被曲线 + MC p10–p90 阴影 |
| 观测对照 | 模型 vs GISTEMP 1880–2024 |
| 海平面分量 | 四分量堆叠面积图（热膨胀 / 冰川 / 冰盖 / 陆地水） |
| 为什么会这样 | 当前年强迫分解条形图 + 海平面分量占比 |
| 结果说明 | 模型范围 / 驱动模式 / 置信标注 / 参数与数据指纹 / 单位与来源表 |
| 对比 | A/B 双情景叠加 + 差值卡 + 阈值首超年 + 受影响城市 |
| 区域 | 2.5° 格点采样 + 框选统计（面积加权 mean/min/max/P10/P90） |
| 影响 | 8 个影响指标卡（暴露人口 / 水资源 / 极端高温 / 农业 / 生态 / 酸化 / 损害 / SCC）+ 适应三档 |
| 实验室 | 7 控制项（排放强度 / 减排起始年 / 净零年份 / 甲烷 / 土地利用 / 碳汇 / 海岸防护）+ 本地保存 |
| 分享 | 可复现链接 / 导出 CSV / 导出 PNG 分享卡片 |

### 🧪 情景实验室

- 自定义排放路径（排放驱动模式，与 SSP 浓度驱动诚实对照）
- 排放强度 ×0.5–1.5、减排起始年 2025–2100、净零年份 2030–2200
- 甲烷 / 土地利用 / 碳汇三档 + 海岸防护三档
- 实验保存到 localStorage（最多 5 个）+ URL 可复现分享

### 📡 公开 API

```bash
# 基础情景
GET /api/simulate?scenario=ssp585&horizon=2500

# 含实验配置（base64 controls）
GET /api/simulate?scenario=ssp245&horizon=2100&exp=<base64>

# 含蒙特卡洛不确定性
GET /api/simulate?scenario=ssp245&uncertainty=mc
```

返回版本化 SimResult JSON（`schemaVersion: 2/3`），含 metadata（模型范围 / 驱动段 / 置信标注 / 数据指纹）、诊断分解（强迫四分量 / 海洋热吸收 / 海冰 / 水循环 / 生物圈 / 碳记账）、canonicalUrl 与实验摘要。输出逐位确定性 → CDN immutable 缓存。

## 架构（spec-as-data）

```
apps/web (Next.js 14)
  └── packages/engine（纯 TS 求解器）
        ├── packages/spec（YAML 规格唯一事实源）
        └── packages/data（静态数据 + manifest 校验）
```

| 包 | 职责 |
|---|---|
| `@future-earth/spec` | 58 变量 / 53 方程 / 90 因果边 / 27 参数 / 4 情景 YAML；zod 校验 + 生成 TS 类型；每条目标注 `impl`（批次）与 `status`（运行时角色：coupled / diagnostic / prescribed / planned） |
| `@future-earth/engine` | RK4 求解器 + 蒙特卡洛 + 实验 + 2.5° 网格场 + 地貌演化 + 影响模块 + 临界点诊断；禁止浏览器 API / 随机数 |
| `@future-earth/data` | 历史数据（GISTEMP / NOAA / OWID）+ WorldClim 基准网格 + GeoNames 城市；全部静态打包，manifest sha256 校验 |

**方程体系**：53 条按 `impl: v0/v1/v2/v3` 分级，全部已实现（v0 核心 + v1 诊断 + v2 生物圈冻土 + v3 地貌）。规格与代码一致性由测试强制。

## 验收门体系

| 类别 | 门 | 数量 | 含义 |
|---|---|---|---|
| 历史复现 | G1–G3 | 3 | 温度 / CO₂ / 海平面对标 1850–2024 观测 |
| 未来情景 | G4 | 1 | 2100 四情景落 IPCC AR6 区间 |
| 物理健全 | G5–G6 | 2 | 确定性 / 守恒 / 稳态 |
| 诊断恒等 | G7–G9 | 3 | 强迫分量和 / 海平面分量和 / 逐位复现 |
| 网格场 | G10–G14 | 5 | 全球均值≡0D / 水量守恒 / 分辨率收敛 / 边界健全 / 确定性 |
| 地貌演化 | G22–G26 | 5 | 质量守恒 / 关闭冻结 / 海岸线一致 / 长期稳定 / 性能 |
| 影响模块 | I-01–I-05 | 5 | 暴露一致 / 水资源一致 / 适应不改变气候 / 越界警告 / 可追溯 |
| 不确定性 | U-01–U-05 | 5 | 种子复现 / 独立开关 / 口径区分 / 触发条件 / 物理/数值区分 |

**合计 29 道自动化验收门**，全部在 `pnpm test` 中作为 CI 门禁运行。

## 版本路线图（已全部交付）

| 版本 | 主题 | 核心交付 |
|---|---|---|
| v0.1 | 可运行原型 | 0D 两层 EBM + 碳循环 + 海平面 + 3D 地球 + G1–G5 |
| v0.2 | 可信度与可解释性 | schemaVersion 2 元数据 + 诊断分解 + 校准报告 + 置信标注 + G7–G9 |
| v0.3 | 情景实验室与分享 | 自定义实验 + 对比 + URL 分享 + /embed + CSV/PNG 导出 |
| v1.0 | 区域化气候场 | 2.5° 基准网格 + 温度/降水/水循环场 + 区域统计 + G10–G14 |
| v1.5 | 反馈侧升级 | 水循环→陆汇 + 冰-反照率反馈（可回滚构造，默认 0 = 逐位一致） |
| v2.0 | 影响与适应 | 8 影响模块 + 适应三档 + I-01–I-05 |
| v3.0 | 海岸与地貌演化 | 网格侵蚀/输沙/沉积/海岸线演化 + G22–G26 |
| v4.0 | 深度不确定性 | 分层不确定性（参数/情景/结构）+ 临界点诊断 + U-01–U-05 |
| v4.1 | 互动体验升级 | 里程碑事件引擎 + 通知卡片 + 大事记时间线 |

## 常用命令

```bash
# 安装（Node >= 20 + pnpm 9）
pnpm install

# 测试与类型检查
pnpm test               # 全部包 vitest（含 29 道验收门）
pnpm typecheck          # 全部包 tsc --noEmit

# 开发与构建
pnpm --filter web dev   # 本地开发服务器
pnpm --filter web build # 生产构建

# 规格生成与校准
pnpm gen:spec           # YAML → spec-types.ts（提交入库，勿手改）
pnpm calibrate          # 重跑确定性校准 → params.json
pnpm report             # 生成校准报告 → docs/superpowers/reports/

# CLI 冒烟
npx tsx packages/engine/src/cli.ts --scenario ssp245 --horizon 2500
```

### 数据更新（需联网）

```bash
node packages/data/scripts/fetch.mjs         # 历史排放 / CO₂ / 温度 / 自然强迫
node packages/data/scripts/gen-forcing.mjs   # 情景序列 2025–2500
node packages/data/scripts/fetch-static.mjs  # 城市（GeoNames + WorldClim）
node packages/data/scripts/gen-grid.mjs      # 2.5° 基准气候网格
node packages/data/scripts/gen-bundle.mjs    # 全部数据 → TS 模块（改数据后必须跑）
```

## 数据源与许可

| 数据 | 来源 | 许可 |
|---|---|---|
| 历史排放 | Global Carbon Project (OWID 镜像) | CC-BY 4.0 |
| CO₂ 浓度 | NOAA GML + Law Dome 冰芯 | 公有领域 |
| 温度 | NASA GISTEMP v4 | 公有领域 |
| 自然强迫 | AR6 Table 7.8 量级锚点合成 | — |
| 情景 | SSP 延伸路径（Meinshausen 2020 端点锚定） | CC-BY 4.0 |
| 城市 + 基准气候 | GeoNames cities15000 + WorldClim 2.1 | CC-BY 4.0 / CC-BY-SA |
| 全球高程 | ETOPO 2022（10 角分聚合） | 公有领域 |
| 纬度带升温模式 | NASA GISTEMP ZonAnn 回归 | 公有领域 |
| 3D 底图 | NASA Blue Marble（本地打包） | 公有领域 |

## 部署（Vercel）

CI：`pnpm install → gen:spec → typecheck → test → report → web build`（GitHub Actions, Node 20）。

Vercel 导入时设置 **Root Directory = `apps/web`** 即可——模拟在客户端运行（Web Worker 优先 + 动态导入回退），API 路由为无状态函数，数据全部静态打包，无持久化需求。

### 本地 E2E 测试

```bash
cd apps/web
npx playwright test       # 16 项 E2E（API / 交互 / 图层 / 视觉 / 实验室 / 分享 / 网格）
```

## 开发文档

| 文档 | 内容 |
|---|---|
| [设计规格书](docs/superpowers/specs/2026-10-11-earth-predictor-design.md) | 架构 / 方程分级 / 验收门（权威） |
| [版本功能规划](docs/10-版本功能规划.md) | v0.1–v4.1 全部版本范围 / 交付状态 / 回填 |
| [校准报告](docs/superpowers/reports/calibration-report.md) | G1–G4 数值 / 参数指纹 / 碳闭合（CI 自动生成） |
| `CLAUDE.md` | 仓库工作约定（命令 / 架构边界 / 领域约定） |
| `docs/superpowers/plans/` | 各版本实现计划（含执行偏差记录） |

## 许可

代码自有；数据按上表各来源许可使用。
