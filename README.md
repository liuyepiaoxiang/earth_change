# 未来地球引擎（Future Earth Engine）

5–500 年地球环境演化模拟器：从人类排放情景出发，计算温度、海平面、冰冻圈与地表状态的耦合演化，以 3D 地球 + 时间轴呈现，支持城市级气候条件与淹没状态查询。

**当前版本 v0**：0D 全球气候核心（碳循环 → 辐射强迫 → 两层海洋能量平衡 → 海平面四分解）+ Pattern Scaling 降尺度 + 3D 仪表盘。模型定量对标 1850–2024 历史观测与 IPCC AR6 2100 情景区间（五道自动化验收门 G1–G5）。

## 功能

- **四个 SSP 情景**（SSP1-2.6 / SSP2-4.5 / SSP3-7.0 / SSP5-8.5）模拟 2026–2500 年，毫秒级出结果
- **3D 地球**：5° 温度点云（Pattern Scaling 纬度带放大，蓝→红色阶）、500 城市点（大小 ∝ √人口，淹没变蓝）、**淹没模拟**——全球高程纹理 shader 逐像素渲染「高程 < 海平面上升」的陆地，随时间轴拖动实时推进、点击城市查看本地升温 / 未来年均温 / 降水 / 群系 / 淹没判定；右上角图层开关（温度点云 / 城市点 / 淹没模拟 / 卫星底图 / 大气辉光）
- **时间轴拖动**：逐年插值，纯渲染零计算
- **公开 API**：`GET /api/simulate?scenario=ssp245&horizon=2500` → 版本化 SimResult JSON（输出确定性，CDN immutable 缓存）

## 架构（spec-as-data）

```
apps/web (Next.js 14) ──→ packages/engine ──→ packages/spec + packages/data
```

| 包 | 职责 | 关键约束 |
|---|---|---|
| `packages/spec` | YAML 规格唯一事实源（57 变量 / 53 方程 / 90 因果边 / 23 参数 / 4 情景 / 数据源目录），zod 校验 + 生成 TS 类型 | 包根入口浏览器安全；Node 侧加载器在 `src/load-spec.ts` |
| `packages/engine` | 纯 TS 求解器：RK4、NaN 守卫、逐位确定性 | 禁止依赖 Next.js / 浏览器 API / 随机数（v1 WASM 依赖此约束） |
| `packages/data` | 数据静态打包 + sha256 manifest 校验；`gen-bundle.mjs` 固化为 TS 模块 | 磁盘文件与 manifest 不符即测试失败 |
| `apps/web` | 3D 地球仪表盘 + `/api/simulate` | 客户端直接跑引擎；workspace 包经 transpilePackages 打包 |

53 条方程按 `impl: v0/v1/v2/v3` 分级（v0 = 21 条）。规格与代码的一致性由测试强制：`impl: v0` 的方程必须已注册、注册表无孤儿、因果图引用可解析。

## 常用命令

```bash
pnpm install            # Node >= 20 + pnpm 9
pnpm test               # 全部包 vitest（含 G1–G5 黄金验收门）
pnpm typecheck          # 全部包 tsc --noEmit
pnpm --filter web dev   # 本地开发服务器
pnpm --filter web build # 生产构建
pnpm gen:spec           # YAML → spec-types.ts（提交入库，勿手改）
pnpm calibrate          # 重跑确定性校准 → packages/engine/params.json
npx tsx packages/engine/src/cli.ts --scenario ssp245 --horizon 2500   # CLI 冒烟
```

数据更新（需联网，产出自动更新 manifest）：

```bash
node packages/data/scripts/fetch.mjs         # 历史排放/CO₂/温度/自然强迫
node packages/data/scripts/gen-forcing.mjs   # 情景序列 2025–2500
node packages/data/scripts/fetch-static.mjs  # 城市（GeoNames+WorldClim）+ 纬度带升温模式（GISTEMP）
node packages/data/scripts/gen-bundle.mjs    # 全部数据 → datasets.gen.ts（改数据后必须跑）
```

## 数据源与许可

| 数据 | 来源 | 许可 |
|---|---|---|
| 历史排放 | Global Carbon Project | CC-BY 4.0 |
| CO₂ 浓度 | NOAA GML + Law Dome 冰芯 | 公有领域 |
| 温度 | NASA GISTEMP v4 | 公有领域 |
| 自然强迫 | AR6 Table 7.8 量级锚点合成 | — |
| 情景 | SSP 延伸路径（2025–2500） | CC-BY 4.0 |
| 城市 + 基准气候 | GeoNames cities15000 + WorldClim 2.1 | CC-BY 4.0 / CC-BY-SA |
| 全球高程（淹没渲染） | WorldClim 2.1 elevation（10 角分，源 ETOPO） | CC-BY-SA |
| 纬度带升温模式 | NASA GISTEMP ZonAnn 回归 | 公有领域 |
| 3D 底图 | NASA Blue Marble（打包于 `apps/web/public/earth-blue-marble.jpg`，无外部 CDN 依赖） | 公有领域 |

## 部署（Vercel）

仓库根 CI：`pnpm install → gen:spec → typecheck → test → web build`（GitHub Actions，node 20）。

Vercel 导入时设置 **Root Directory = `apps/web`** 即可；模拟在客户端运行，API 路由为无状态函数，无持久化需求（数据全部静态打包）。

## 开发文档

1. `docs/superpowers/specs/2026-10-11-earth-predictor-design.md` — 设计规格书（权威：架构、方程分级、验收门、路线图）
2. `docs/superpowers/plans/2026-10-11-earth-engine-v0-core.md` — 计划 A（引擎，已完成）
3. `docs/superpowers/plans/2026-10-11-earth-engine-v0-web.md` — 计划 B（前端与部署，已完成）
4. `AGENTS.md` — 仓库工作约定（命令、坑、架构边界）
