# 未来地球引擎 v0 — 前端与部署实现计划（计划 B）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (或 subagent-driven-development) 逐任务执行。步骤用 `- [ ]` 跟踪。

**Goal:** 交付 apps/web——3D 地球 + 时间轴拖动 + 城市面板 + /api/simulate，构建可部署 Vercel。

**Architecture:** Next.js 14 App Router 客户端组件运行引擎（毫秒级、缓存于内存），时间轴拖动 = 纯渲染；react-globe.gl 渲染温度点云层（pattern scaling × 全球 ΔT）与城市点层（GeoNames 高程 vs SLR 判淹没）；API 路由暴露确定性 SimResult（CDN immutable）。

**Tech Stack:** next@14.2、react@18、react-globe.gl、three、zod、vitest（web 包内仅测纯函数）。

**规格依据:** SPEC §8（应用与 API）、§5.3（静态空间数据）。**关键决策（相对 SPEC §8.2 的偏差，执行时验证后回填 SPEC）:** DEM GPU shader 层降级为「城市点级淹没 + 温度带点云」——ETOPO 60" 直链不可靠，v0 以可靠数据先行，shader 层留 v1（代码预留 GlobeView 分层结构）。

**完成判据:** `pnpm -r test` 全绿（含既有 56 个）+ `pnpm --filter web build` 成功 + API 返回带 schemaVersion 的 SimResult + 页面可交互（时间轴拖动 60fps 目标）。

---

### Task B1: apps/web 脚手架（可构建）
- [x] package.json（next/react/react-dom/react-globe.gl/three/zod/@future-earth/engine workspace 依赖；devDeps: typescript/@types/*、vitest）
- [x] next.config.mjs（transpilePackages: 三个 workspace 包；reactStrictMode）
- [x] tsconfig.json（extends 根 base，jsx: preserve，next 插件由 next 自动处理）
- [x] app/layout.tsx + app/page.tsx（最小占位）；.gitignore 追加 .next
- [x] 验收: `pnpm --filter web build` 成功

### Task B2: /api/simulate + 查询解析单测
- [x] lib/simulate-query.ts: `parseSimulateQuery(url): {scenario, horizon} | error`（zod: scenario∈4 SSP, horizon∈[2026,2500] 整数）
- [x] app/api/simulate/route.ts: GET → runScenario → `Cache-Control: public, max-age=31536000, immutable`；非法参数 400 JSON
- [x] lib/simulate-query.test.ts（合法/非法/边界）
- [x] 验收: vitest 过 + build 过

### Task B3: 城市数据（GeoNames + Open-Meteo 基准气候）
- [x] scripts/fetch-cities.mjs（data 包）: 下载 cities15000.zip → PowerShell Expand-Archive → TSV 解析 → 人口 top 500 → 逐城调 Open-Meteo climate-api（1991-2020 ERA5 年均温/年降水，失败跳过）→ datasets/static/cities_top500.csv（name,country,lat,lon,elevation,population,tbase,pbase）+ manifest
- [x] data/src/loaders.ts: loadCities()；测试（行数 300-600、字段范围）
- [x] 验收: pnpm --filter @future-earth/data test 过

### Task B4: 真实纬度带升温模式（GISTEMP ZonAnn 回归）
- [x] scripts/fetch-pattern.mjs: 下载 ZonAnn.Ts+dSST.csv → 各带 vs 全球回归（1960-2024 OLS 斜率）→ datasets/static/warming_pattern_lat.csv（latMin,latMax,amp）+ manifest
- [x] loaders: loadWarmingPattern()；测试（7-9 带、amp 0.5-4）
- [x] 验收: 同上

### Task B5: 仪表盘 UI（核心）
- [x] lib/sim.ts: `useSimulation(scenario)` —— dynamic import engine、useMemo 缓存 SimResult；`metricsAt(sim, year)` 年份插值；`localDTs/pattern` 用真实 warming_pattern
- [x] components/GlobeView.tsx（client, dynamic ssr:false 包 react-globe.gl）: 蓝色大理石底图（unpkg three-globe 示例图）；温度层: 5° 网格点（72×36）着色 = dT×amp(lat) 色阶（蓝→红）；城市层: 点大小∝√人口、色 = 淹没?#38bdf8:#eab308，alt=城市高程 vs SLR 显示高度差；onPointClick → 选城
- [x] components/Timeline.tsx（range 2026-2500 step1）、ScenarioSelector、MetricsBar（ΔT/CO₂/SLR/海平面分量）、CityPanel（ΔT_local、年均温=tbase+ΔT_local、降水=pbase×(1+0.02ΔT)、群系=engine.classifyBiome、淹没判定）
- [x] app/page.tsx 组装；layout metadata「未来地球引擎」
- [x] 验收: build 成功；node 脚本冒烟 metricsAt 插值正确

### Task B6: CI + README + 收尾
- [x] .github/workflows/ci.yml: pnpm install → gen:spec → typecheck → test → --filter web build（node 20）
- [x] README.md: 项目简介/架构图/命令/数据源与许可/Vercel 部署（Root Directory=apps/web）
- [x] SPEC 回填偏差（shader→v1）；全仓验证 + 提交
