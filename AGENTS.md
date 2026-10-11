# AGENTS.md

未来地球引擎：5–500 年地球环境演化模拟器（排放情景 → 温度/海平面/冰冻圈耦合演化 → 3D 地球 + 时间轴）。TypeScript / pnpm monorepo / Next.js 14，部署 Vercel。**文档语言中文，代码标识符英文，提交信息中文。**

## 布局

- `packages/spec` — YAML 规格是唯一事实源（`src/spec/*.yaml`：变量/方程/因果图/参数/情景/数据集）。zod 校验；`gen:spec` 生成 `src/generated/spec-types.ts`（**提交入库，勿手改**）
- `packages/engine` — 纯 TS 求解器。**禁止依赖 Next.js / 浏览器 API**（v1 WASM 移植依赖此约束）。RK4、NaN 守卫、逐位确定性，**禁止随机数**。公开入口 `runScenario(id, horizon)`：历史 1850–2024 与情景段 2025–horizon 串联（情景段浓度驱动），输出版本化 SimResult
- `packages/data` — 数据全部静态打包（Vercel 无持久化）。两步管道：抓取脚本（`scripts/fetch*.mjs`、`gen-forcing.mjs`）写 `datasets/{historical,scenarios,static}/` 并更新 `manifest.json`（sha256/bytes/来源/抓取日期）→ `gen-bundle.mjs` 固化为 `src/generated/datasets.gen.ts`；**运行时 loaders 读生成模块，不读磁盘**。manifest 与磁盘不一致即测试失败
- `apps/web` — Next.js 14 App Router；客户端组件直接跑引擎（毫秒级）；`/api/simulate` 输出确定性结果 → `Cache-Control: immutable`

## 常用命令（仓库根目录）

```bash
pnpm test                                  # pnpm -r 递归跑，首个失败包即停
pnpm typecheck                             # 全部包 tsc --noEmit（无独立 lint script）
pnpm --filter @future-earth/engine test -- golden   # 单测试文件（按名过滤）
pnpm --filter web dev                      # Next.js 开发服务器
pnpm --filter web build                    # Next.js 构建
pnpm gen:spec                              # YAML → spec-types.ts
pnpm calibrate                             # 重跑校准 → packages/engine/params.json
npx tsx packages/engine/src/cli.ts --scenario ssp245 --horizon 2500   # CLI 冒烟
node packages/data/scripts/fetch.mjs       # 重抓历史数据（需联网）
node packages/data/scripts/gen-forcing.mjs # 重新生成强迫/情景序列
node packages/data/scripts/fetch-static.mjs # 城市基准气候 + 纬度带升温模式（需联网，Windows 用 PowerShell 解压）
node packages/data/scripts/gen-bundle.mjs  # datasets → datasets.gen.ts（改任何数据文件后必须跑，否则 loaders 还是旧值）
```

## 必读文档（改敏感区前，按序）

1. `docs/superpowers/specs/2026-10-11-earth-predictor-design.md` — 设计规格书（权威）：架构、方程分级、G1–G5 验收门、§11 非目标
2. `docs/superpowers/plans/2026-10-11-earth-engine-v0-core.md` — 计划 A（引擎 16 任务，**已完成**）；`...-v0-web.md` — 计划 B（前端/部署 6 任务，**已完成**，v0 已交付）。下一阶段按规格书 §10 路线图（v1：蒙特卡洛、2D 模式场、WASM）
3. `docs/00–07` 流程文档（2026-10-11 建立，进度以 `03-开发任务清单` 为准）——**00 派生总控**（项目规则 + 问题记录，接任务前必读）、**04 功能卡与测试映射**（改功能前对照）、**05 测试矩阵与冒烟清单**（发版前跑 §5 手工冒烟）、**06 环境手册**（含故障表）、01 资产盘点 / 02 需求映射 / 07 v1 准入复核

与计划的已知偏差（已回填规格书 §5.3/§8.2）：城市基准气候用 WorldClim GeoTIFF（`geotiff` 库）而非计划写的 Open-Meteo；DEM shader 淹没层降级为「城市点级淹没 + 温度带点云」，shader 层留 v1。

## 架构与关键规则

- **改方程的正确顺序**：先改 `equations.yaml` → `pnpm gen:spec` → 在 `packages/engine/src/equations/`（按域分文件：forcing/ocean/carbon/sealevel/downscale）实现纯函数 → 注册进 `registry.ts`（`Partial<Record<EquationId, EqFn>>`，一致性测试只校验存在性与可调用性）→ 补单测。不允许只改一边
- **校准值提交入库**：`packages/engine/params.json` + `src/generated/params.gen.ts`。校准失败回到参数先验（`parameters.yaml`）调整，**不许放宽 golden 阈值**——G4 过而 G1–G3 失败 = 蒙对答案，不可接受
- **golden.test.ts 是 CI 门禁**（G1–G5）：历史复现 + 2100 四情景落在 IPCC AR6 区间 + 物理健全性

## 平台兼容与坑

- **workspace 包以 TS 源分发**（`exports: "./src/index.ts"`），包内 import 一律带 `.js` 后缀（ESM 惯例）；`apps/web/next.config.mjs` 用 `transpilePackages` + `extensionAlias` 映射回 `.ts`——新增包要同步加进 transpilePackages。**spec 包根入口必须保持浏览器安全**：fs/yaml 的 `loadSpec` 在 `src/load-spec.ts`（Node 专用），勿在 index.ts 引入 node 内置模块；engine 同理（`node:crypto` 已改为校准期预计算指纹）
- **manifest 测试扫描 `datasets/` 下所有文件**：任何未登记的文件都会挂 `src/manifest.test.ts`。`datasets/_tmp/` 是抓取脚本的下载暂存区，脚本正常结束会自删；**中途被打断会留残留 → 删掉 `_tmp/` 即恢复测试**
- **行尾必须 LF**：`.gitattributes` 强制 `* text=auto eol=lf`；CSV 无引号、UTF-8、LF。行尾或内容一变 manifest sha256 即失配、测试即挂（曾因此返工，勿用 CRLF 编辑器写入）
- `tsconfig.base.json` 开 `strict` + `noUncheckedIndexedAccess`，索引访问需判空
- API horizon 合法域 [2026, 2500] 整数，scenario ∈ 4 个 SSP（锚点在 `scenarios.yaml`）
- **CI 已建立**（`.github/workflows/ci.yml`：install → gen:spec → typecheck → test → web build，node 20 + pnpm 9）；本地改动后仍建议先跑 `pnpm test` + `pnpm --filter web build`
- **底图显隐不要走 `globeImageUrl` prop**：three-globe 该 setter 的 OFF 分支不清 map 也不置 needsUpdate，ON 分支设 `color = null` 会被渲染器 uniform 刷新跳过——关→开后 diffuse 残留黑色、永远渲染黑球。正确做法是纹理自己加载一次，在自定义材质上成对切换 `map`/`color` 并显式 `needsUpdate`（见 GlobeView 的 applyBasemap）
- 改任何 `packages/data/datasets/` 下的数据文件后，**必须重跑 `node packages/data/scripts/gen-bundle.mjs`**——运行时 loaders 读生成模块，不重跑则改动对引擎/前端不可见（B3/B4 曾因此空数据静默上线）

## 领域约定

- 温度 = 相对 1850 的异常（K）；海平面分量 = 累计上升（m），冰量用 m SLE；排放 GtC/yr（1 ppm CO₂ = 2.124 GtC）
- v0 非目标（勿顺手实现）：2D 网格求解、蒙特卡洛、海冰动态、区域降水格局、在线抓取管道——见规格书 §11
