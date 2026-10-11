# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目：未来地球引擎

5–500 年地球环境演化模拟器。从人类排放情景出发，计算温度、海平面、冰冻圈与地表状态的耦合演化（0D 两层海洋能量平衡 + 碳循环 + 海平面四分解 + 模式缩放降尺度），最终以 3D 地球 + 时间轴呈现。技术栈 TypeScript / pnpm monorepo / Next.js（部署 Vercel）。

**文档语言为中文，代码标识符用英文。**

## 文档体系（改动前必读，按此顺序）

1. `docs/superpowers/specs/2026-10-11-earth-predictor-design.md` — **设计规格书（权威）**：架构、数据模型、方程分级、G1–G5 验收门
2. `docs/superpowers/plans/2026-10-11-earth-engine-v0-core.md` — **计划 A（当前执行）**：16 个 TDD 任务，含全部代码与 YAML 完整内容；计划 B（前端/Vercel）待 A 完成后编写
3. `docs/01-问题设计.md`、`docs/02-本体初稿设计.md` — 概念起源：模型分层思想与 53 方程因果图草稿

## 当前状态

设计与计划已获批并提交，**代码尚未实现**。下一步是按计划 A 逐任务执行（从 Task 1 monorepo 脚手架开始）。下列命令在计划 A 的 Task 1 完成后可用。

## 常用命令（仓库根目录执行）

```bash
pnpm install                          # 安装（Node >= 20，内置 fetch）
pnpm test                             # 全部包测试（vitest）
pnpm --filter @future-earth/engine test        # 单包测试
pnpm --filter @future-earth/engine test -- golden   # 单个测试文件（vitest 按名过滤）
pnpm gen:spec                         # 从 YAML 重新生成 packages/spec/src/generated/spec-types.ts
pnpm calibrate                        # 重跑确定性校准 → packages/engine/params.json
pnpm typecheck                        # 三包 tsc --noEmit
npx tsx packages/engine/src/cli.ts --scenario ssp245 --horizon 2500   # CLI 冒烟
node packages/data/scripts/fetch.mjs              # 重新抓取真实历史数据（需联网）
node packages/data/scripts/gen-forcing.mjs        # 重新生成强迫/情景序列
```

## 架构：规格即数据（spec-as-data）

```
apps/web (计划B) ──→ packages/engine ──→ packages/spec + packages/data
```

- `packages/spec` — **YAML 是唯一事实源**（57 变量 / 53 方程 / 90 因果边 / 23 参数 / 4 情景 / 10 数据源）。zod 加载期校验；`gen:spec` 生成 TS 类型（**提交入库，勿手改**）；一致性测试强制「YAML 中 `impl: v0` 的方程必须已注册、注册表无孤儿」
- `packages/engine` — 纯 TS 求解器，**禁止依赖 Next.js / 浏览器 API**（v1 的 WASM 移植依赖此约束）。RK4 积分、NaN 守卫、逐位确定性（**禁止随机数**——蒙特卡洛属 v1）
- `packages/data` — 数据全部**静态打包**（Vercel 无持久化）；`manifest.json` 记录 sha256 校验和，文件与 manifest 不符即测试失败

### 方程体系与分级

方程 id `eq_01`–`eq_53` 定义在 `equations.yaml`，每条标注 `impl: v0/v1/v2/v3`。v0 = 21 条（气候核心 + 海平面 + 城市级淹没/群系 + 降尺度）。方程实现在 `packages/engine/src/equations/` 按域分文件，经 `registry.ts` 按 id 绑定。

**新增/修改方程的正确顺序**：先改 `equations.yaml`（含公式、输入输出、参数引用）→ `pnpm gen:spec` → 实现纯函数 → 注册进 `REGISTRY` → 补单测。规格与代码的一致性由测试强制，不允许只改一边。

### 校准与验收

- 参数先验（默认值/范围/文献来源）在 `parameters.yaml`；**校准后的值在 `packages/engine/params.json`（提交入库）**，含每情景排放 scale 因子（`scenarioScale`，端点校正命中 Meinshausen 2020 的 2100 浓度目标）
- `golden.test.ts` 是 CI 门禁的 G1–G5 五道验收门（历史温度/CO₂/海平面复现 + 2100 四情景落在 IPCC AR6 区间 + 物理健全性）。**G4 通过而 G1–G3 失败 = 蒙对答案，不可接受**；校准回路失败时回到参数先验调整，不是放宽阈值
- 数据 CSV 约定：无引号、UTF-8、LF；`forcing_natural_1850_2024.csv` 列为 `year,ch4,n2o,f_other`

## 领域约定

- 温度均为相对 1850 的异常（K）；海平面分量为自起算年的累计上升（m），冰川/冰盖以 m SLE（海平面当量）计量；排放单位 GtC/yr（1 ppm CO₂ = 2.124 GtC）
- 情景：SSP1-2.6 / SSP2-4.5 / SSP3-7.0 / SSP5-8.5，锚点定义在 `scenarios.yaml`，`gen-forcing.mjs` 展开为 2025–2500 年度序列
- v0 明确不做（勿顺手实现）：2D 网格求解、蒙特卡洛、海冰范围动态、区域降水格局、数据在线抓取管道——见规格书 §11 非目标清单
