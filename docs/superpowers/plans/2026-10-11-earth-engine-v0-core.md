# 未来地球引擎 v0 — 核心引擎实现计划（计划 A）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付 pnpm monorepo 的科学核心：完整本体规格 YAML（57 变量 / 53 方程 / 90 因果边）、精选数据层、0D 两层 EBM 求解器、分阶段校准与 G1–G5 黄金验收测试，外加 CLI 冒烟工具。

**Architecture:** 规格即数据（spec-as-data）：YAML 是唯一事实源，zod 校验 + 构建期生成 TS 类型 + 一致性测试防止规格与代码漂移。引擎为纯 TypeScript ODE 求解器（RK4），零框架依赖。校准用分阶段确定性 Nelder-Mead，产物 params.json 提交入库保证复现。

**Tech Stack:** pnpm workspaces、TypeScript 5 (strict)、vitest、zod、yaml、tsx（运行 TS 脚本）、Node ≥ 20（内置 fetch）。

**规格依据:** `docs/superpowers/specs/2026-10-11-earth-predictor-design.md`（本文引用为 SPEC §N）

**计划 B（本计划完成后另行编写）:** apps/web（3D 地球 + 时间轴 + 城市面板）、/api/simulate、静态空间数据（DEM/城市/升温模式/基准气候）、CI 与 Vercel。

---

## 文件结构总图

```
earth_change/
├── package.json                      # 根工作区（Task 1）
├── pnpm-workspace.yaml               # Task 1
├── tsconfig.base.json                # Task 1
├── packages/
│   ├── spec/
│   │   ├── package.json  vitest.config.ts  tsconfig.json
│   │   ├── src/schema.ts             # 7 类文件的 zod schema（Task 2）
│   │   ├── src/index.ts              # loadSpec() 类型化加载器（Task 2）
│   │   ├── src/spec/
│   │   │   ├── ontology.yaml         # Task 2（完整内容见任务内）
│   │   │   ├── parameters.yaml       # Task 3
│   │   │   ├── scenarios.yaml        # Task 4
│   │   │   ├── variables.yaml        # Task 5
│   │   │   ├── equations.yaml        # Task 6
│   │   │   ├── causal_graph.yaml     # Task 7
│   │   │   └── datasets.yaml         # Task 7
│   │   ├── scripts/gen-types.ts      # Task 8（生成 src/generated/spec-types.ts 并提交）
│   │   └── src/consistency.test.ts   # Task 8
│   ├── data/
│   │   ├── package.json  vitest.config.ts  tsconfig.json
│   │   ├── scripts/fetch.mjs         # Task 9（下载 GISTEMP/NOAA CO₂/OWID 排放）
│   │   ├── scripts/gen-forcing.mjs   # Task 10（生成 forcing_natural.csv + 情景 JSON）
│   │   ├── datasets/
│   │   │   ├── historical/{emissions,co2_concentration,temperature}.csv
│   │   │   ├── historical/forcing_natural.csv
│   │   │   ├── scenarios/ssp{126,245,370,585}.json
│   │   │   └── manifest.json
│   │   └── src/{loaders.ts, manifest.test.ts, loaders.test.ts}
│   └── engine/
│       ├── package.json  vitest.config.ts  tsconfig.json
│       ├── params.json               # Task 15 校准产物（提交入库）
│       └── src/
│           ├── types.ts              # Task 11
│           ├── registry.ts           # Task 11
│           ├── equations/{forcing,carbon,ocean,sealevel,downscale}.ts   # Task 11-12
│           ├── solver.ts             # Task 13
│           ├── scenario.ts           # Task 13
│           ├── calibrate.ts          # Task 14（Nelder-Mead + 三阶段校准）
│           ├── golden.test.ts        # Task 15（G1–G5）
│           └── cli.ts                # Task 16
```

**约定**：所有包名前缀 `@future-earth/`；所有 CSV 为无引号简单格式（逗号分隔、UTF-8、LF）；所有命令在仓库根目录执行。

---

### Task 1: Monorepo 脚手架

**Files:**
- Create: `package.json`、`pnpm-workspace.yaml`、`tsconfig.base.json`
- Create: `packages/{spec,data,engine}/package.json`、`packages/{spec,data,engine}/tsconfig.json`、`packages/{spec,data,engine}/vitest.config.ts`

- [ ] **Step 1: 写根配置文件**

`pnpm-workspace.yaml`:
```yaml
packages:
  - packages/*
  - apps/*
```

`package.json`:
```json
{
  "name": "future-earth-engine",
  "private": true,
  "engines": { "node": ">=20" },
  "scripts": {
    "gen:spec": "tsx packages/spec/scripts/gen-types.ts",
    "calibrate": "tsx packages/engine/src/calibrate.ts",
    "test": "pnpm -r --if-present test",
    "typecheck": "pnpm -r --if-present typecheck"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tsx": "^4.19.0",
    "vitest": "^2.1.0",
    "@types/node": "^20.14.0"
  }
}
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "composite": false
  }
}
```

- [ ] **Step 2: 写三个包的 package.json / tsconfig / vitest 配置**

`packages/spec/package.json`:
```json
{
  "name": "@future-earth/spec",
  "version": "0.1.0",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "test": "vitest run", "typecheck": "tsc --noEmit" },
  "dependencies": { "yaml": "^2.5.0", "zod": "^3.23.0" }
}
```

`packages/data/package.json`:
```json
{
  "name": "@future-earth/data",
  "version": "0.1.0",
  "type": "module",
  "exports": { ".": "./src/loaders.ts" },
  "scripts": { "test": "vitest run", "typecheck": "tsc --noEmit" },
  "dependencies": { "@future-earth/spec": "workspace:*", "zod": "^3.23.0" }
}
```

`packages/engine/package.json`:
```json
{
  "name": "@future-earth/engine",
  "version": "0.1.0",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "test": "vitest run", "typecheck": "tsc --noEmit" },
  "dependencies": { "@future-earth/spec": "workspace:*", "@future-earth/data": "workspace:*", "zod": "^3.23.0" },
  "devDependencies": { "@future-earth/spec": "workspace:*" }
}
```
（注：engine 的 devDependencies 行可省略，dependencies 已含。）

三个包的 `tsconfig.json` 完全相同（把 name 换掉）：
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": ".", "outDir": "dist" },
  "include": ["src", "scripts"]
}
```

三个包的 `vitest.config.ts` 完全相同：
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["src/**/*.test.ts", "scripts/**/*.test.ts"] },
});
```

- [ ] **Step 3: 冒烟测试（验证工作区连通）**

`packages/spec/src/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("workspace smoke", () => {
  it("runs vitest", () => { expect(1 + 1).toBe(2); });
});
```

Run: `pnpm install && pnpm test`
Expected: `@future-earth/spec` 1 个测试通过，exit 0

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json packages/ pnpm-lock.yaml
git commit -m "chore: pnpm monorepo 脚手架（spec/data/engine 三包）"
```

---

### Task 2: 规格包基础——zod schema、ontology.yaml、加载器

**Files:**
- Create: `packages/spec/src/schema.ts`
- Create: `packages/spec/src/index.ts`
- Create: `packages/spec/src/spec/ontology.yaml`
- Test: `packages/spec/src/spec.test.ts`

- [ ] **Step 1: 写 zod schema（先定义测试要遵守的契约）**

`packages/spec/src/schema.ts`:
```ts
import { z } from "zod";

export const ImplTier = z.enum(["v0", "v1", "v2", "v3"]);

export const OntologySchema = z.object({
  domains: z.array(z.object({
    id: z.string(),
    name_en: z.string(),
    name_zh: z.string(),
    children: z.array(z.string()).default([]),
  })),
});

export const VariableSchema = z.object({
  id: z.string().regex(/^[a-z_]+\.[a-z_0-9]+$/, "id 必须是 domain.name 形式"),
  name_en: z.string(),
  name_zh: z.string(),
  domain: z.string(),
  unit: z.string(),
  spatial: z.boolean(),
  state_variable: z.boolean(),
  drivers: z.array(z.string()).default([]),
  affects: z.array(z.string()).default([]),
  equations: z.array(z.string()).default([]),
  timescale: z.object({ min: z.number(), typical: z.number(), max: z.number() }),
  data_source: z.string().nullable().default(null),
  impl: ImplTier,
});

export const EquationSchema = z.object({
  id: z.string().regex(/^eq_\d{2}$/),
  name_en: z.string(),
  name_zh: z.string(),
  domain: z.string(),
  formula: z.string(),
  inputs: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([]),
  parameters: z.array(z.string()).default([]),
  notes: z.string().default(""),
  impl: ImplTier,
});

export const ParameterSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name_zh: z.string(),
  unit: z.string(),
  default: z.number(),
  min: z.number(),
  max: z.number(),
  source: z.string(),
  impl: ImplTier,
});

export const CausalEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  mechanism: z.string(),
  sign: z.enum(["positive", "negative"]),
  equation: z.string().nullable().default(null),
  loops: z.array(z.string()).default([]),
});

export const ScenarioSchema = z.object({
  id: z.enum(["ssp126", "ssp245", "ssp370", "ssp585"]),
  name: z.string(),
  name_zh: z.string(),
  target_co2_2100_ppm: z.number(),
  co2_emission_anchors_gtc: z.record(z.string(), z.number()),
  luluc_anchors_gtc: z.record(z.string(), z.number()),
  ch4_anchors_ppb: z.record(z.string(), z.number()),
  n2o_anchors_ppb: z.record(z.string(), z.number()),
  f_other_anchors_wm2: z.record(z.string(), z.number()),
  land_water_rate_m_yr: z.number(),
});

export const DatasetSchema = z.object({
  id: z.string(),
  path: z.string(),
  provider: z.string(),
  url: z.string(),
  license: z.string(),
  stage: z.enum(["a", "b"]),
  variables: z.array(z.string()),
  notes: z.string().default(""),
});

export const SpecBundleSchema = z.object({
  ontology: OntologySchema,
  variables: z.array(VariableSchema),
  equations: z.array(EquationSchema),
  parameters: z.array(ParameterSchema),
  causal_graph: z.array(CausalEdgeSchema),
  scenarios: z.array(ScenarioSchema),
  datasets: z.array(DatasetSchema),
});
```

- [ ] **Step 2: 写加载器**

`packages/spec/src/index.ts`:
```ts
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { SpecBundleSchema } from "./schema.js";

const SPEC_DIR = join(dirname(fileURLToPath(import.meta.url)), "spec");

function loadYaml<T>(name: string): T {
  return parse(readFileSync(join(SPEC_DIR, name), "utf8")) as T;
}

export function loadSpec() {
  const raw = {
    ontology: loadYaml("ontology.yaml"),
    variables: loadYaml("variables.yaml"),
    equations: loadYaml("equations.yaml"),
    parameters: loadYaml("parameters.yaml"),
    causal_graph: loadYaml("causal_graph.yaml"),
    scenarios: loadYaml("scenarios.yaml"),
    datasets: loadYaml("datasets.yaml"),
  };
  return SpecBundleSchema.parse(raw); // 不合法立即抛错
}
export { SpecBundleSchema } from "./schema.js";
```
（此时 variables/equations 等文件尚不存在——本任务先创建**空数组**占位文件 `variables.yaml: []`、`equations.yaml: []`、`parameters.yaml: []`、`causal_graph.yaml: []`、`scenarios.yaml: []`、`datasets.yaml: []`，后续任务逐个替换为完整内容。）

- [ ] **Step 3: 写 ontology.yaml（完整内容，SPEC §4.1）**

`packages/spec/src/spec/ontology.yaml`:
```yaml
domains:
  - { id: forcing, name_en: External Forcing, name_zh: 外部强迫, children: [solar, volcanic, anthropogenic] }
  - { id: atmosphere, name_en: Atmosphere, name_zh: 大气, children: [ghg, temperature, humidity, wind, clouds] }
  - { id: ocean, name_en: Ocean, name_zh: 海洋, children: [temperature, salinity, heat, carbon, sea_level] }
  - { id: cryosphere, name_en: Cryosphere, name_zh: 冰冻圈, children: [glacier, ice_sheet, sea_ice, snow, permafrost] }
  - { id: hydrosphere, name_en: Hydrosphere, name_zh: 水圈, children: [precipitation, evaporation, runoff, soil_water, groundwater, river] }
  - { id: biosphere, name_en: Biosphere, name_zh: 生物圈, children: [vegetation, biomass, npp, fire, biome] }
  - { id: pedosphere, name_en: Pedosphere, name_zh: 土壤圈, children: [soil_moisture, soil_carbon, soil_depth, erosion] }
  - { id: geosphere, name_en: Geosphere, name_zh: 岩石圈/地表, children: [dem, sediment, river_network, coast, landform] }
  - { id: human, name_en: Human System, name_zh: 人类系统, children: [population, energy, land_use, emissions, adaptation] }
  - { id: surface, name_en: Earth Surface State, name_zh: 地球表层状态, children: [land_cover, biome_map, coastline, glacier_extent, desert_extent, wetland_extent] }
```

- [ ] **Step 4: 写测试**

`packages/spec/src/spec.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { loadSpec } from "./index.js";

describe("spec bundle", () => {
  it("加载并通过 zod 校验", () => {
    const spec = loadSpec();
    expect(spec.ontology.domains).toHaveLength(10);
  });
  it("域 id 唯一", () => {
    const ids = loadSpec().ontology.domains.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 5: 运行测试并提交**

Run: `pnpm --filter @future-earth/spec test`
Expected: 2 passed

```bash
git add packages/spec
git commit -m "feat(spec): zod schema + ontology.yaml + 类型化加载器"
```

---

### Task 3: parameters.yaml（v0 全部可调参数与先验）

**Files:**
- Create: `packages/spec/src/spec/parameters.yaml`
- Test: `packages/spec/src/parameters.test.ts`

- [ ] **Step 1: 写 parameters.yaml（完整内容；数值依据见 notes/source 列）**

`packages/spec/src/spec/parameters.yaml`（每行一个条目，flow 风格）:
```yaml
# 三个大气/海洋核心参数组 —— 先验范围来自 Geoffroy et al. 2013 / IPCC AR6 Box 7.1
- { id: lambda, symbol: "λ", name_zh: 气候反馈参数, unit: "W/m²/K", default: 1.16, min: 0.75, max: 1.85, source: "Geoffroy 2013; ECS=F2x/λ → 2.0~4.9°C", impl: v0 }
- { id: gamma_ocean, symbol: "γ", name_zh: 表层-深层海洋热交换系数, unit: "W/m²/K", default: 0.73, min: 0.4, max: 1.5, source: "Geoffroy 2013", impl: v0 }
- { id: c_s, symbol: "Cs", name_zh: 表层有效热容量, unit: "W·yr/m²/K", default: 8.2, min: 5.0, max: 14.0, source: "Geoffroy 2013 (大气+混合层)", impl: v0 }
- { id: c_d, symbol: "Cd", name_zh: 深海有效热容量, unit: "W·yr/m²/K", default: 105.0, min: 70.0, max: 160.0, source: "Geoffroy 2013", impl: v0 }
# 辐射强迫
- { id: c0_ref, symbol: "C0", name_zh: 工业前 CO₂ 参考浓度, unit: ppm, default: 280.0, min: 278.0, max: 285.0, source: "冰芯 (1750)", impl: v0 }
- { id: a_ch4, symbol: "a_CH4", name_zh: CH₄ 强迫系数, unit: "W/m²/ppb^0.5", default: 0.036, min: 0.028, max: 0.045, source: "Myhre 1998 简化式", impl: v0 }
- { id: a_n2o, symbol: "a_N2O", name_zh: N₂O 强迫系数, unit: "W/m²/ppb^0.5", default: 0.12, min: 0.09, max: 0.15, source: "Myhre 1998 简化式", impl: v0 }
- { id: ch4_ref, symbol: "M0", name_zh: 工业前 CH₄ 浓度, unit: ppb, default: 722.0, min: 715.0, max: 730.0, source: "冰芯", impl: v0 }
- { id: n2o_ref, symbol: "N0", name_zh: 工业前 N₂O 浓度, unit: ppb, default: 273.0, min: 268.0, max: 278.0, source: "冰芯", impl: v0 }
# 碳循环
- { id: beta_land, symbol: "β_L", name_zh: 陆地汇 CO₂ 施肥系数, unit: "GtC/yr/ln", default: 8.8, min: 5.0, max: 13.0, source: "先验=当前陆汇3.6GtC/yr ÷ ln(422/280)", impl: v0 }
- { id: k_ocean, symbol: "k_oc", name_zh: 海洋碳吸收系数, unit: "GtC/yr/ppm", default: 0.020, min: 0.010, max: 0.035, source: "先验=当前海汇2.9GtC/yr ÷ ΔC 142ppm", impl: v0 }
- { id: chi_temp, symbol: "χ", name_zh: 海洋碳吸收温度抑制, unit: "GtC/yr/K", default: 0.10, min: 0.04, max: 0.20, source: "AR6 碳循环反馈量级", impl: v0 }
- { id: ppm_per_gtc, symbol: "κ", name_zh: ppm/GtC 换算, unit: ppm/GtC, default: 0.4708, min: 0.4708, max: 0.4708, source: "1 ppm CO₂ = 2.124 GtC", impl: v0 }
# 海平面
- { id: k_thermal, symbol: "k_th", name_zh: 热膨胀系数, unit: "m/(W/m²·yr)", default: 0.0045, min: 0.002, max: 0.008, source: "AR6 热膨胀效率量级", impl: v0 }
- { id: k_glacier, symbol: "k_g", name_zh: 冰川损失系数, unit: "m SLE/(yr·K)", default: 0.0005, min: 0.0003, max: 0.0008, source: "先验=当前~1mm/yr ÷ (1.3K×1.5放大)", impl: v0 }
- { id: amp_glacier, symbol: "A_g", name_zh: 冰川区升温放大, unit: "1", default: 1.5, min: 1.2, max: 1.8, source: "山地冰川区升温高于全球", impl: v0 }
- { id: g0_glacier, symbol: "G0", name_zh: 冰川总储量(海平面当量), unit: "m SLE", default: 0.40, min: 0.36, max: 0.44, source: "Farinotti 2019 / RGI", impl: v0 }
- { id: b0_gris, symbol: "b0", name_zh: 格陵兰基线损失率, unit: "m SLE/yr", default: 0.0002, min: 0.0001, max: 0.0004, source: "GRACE ~0.75mm/yr 量级", impl: v0 }
- { id: b1_gris, symbol: "b1", name_zh: 格陵兰线性敏感度, unit: "m SLE/(yr·K)", default: 0.001, min: 0.0005, max: 0.002, source: "Fettweis SMB 拟合量级", impl: v0 }
- { id: b2_gris, symbol: "b2", name_zh: 格陵兰二次敏感度, unit: "m SLE/(yr·K²)", default: 0.0002, min: 0.0001, max: 0.0005, source: "Fettweis SMB 拟合量级", impl: v0 }
- { id: amp_gris, symbol: "A_Gr", name_zh: 格陵兰区升温放大, unit: "1", default: 2.0, min: 1.5, max: 2.5, source: "北极放大", impl: v0 }
- { id: c0_ais, symbol: "c0", name_zh: 南极基线损失率, unit: "m SLE/yr", default: 0.0001, min: 0.0, max: 0.0003, source: "GRACE AIS ~0.3-0.4mm/yr", impl: v0 }
- { id: c1_ais, symbol: "c1", name_zh: 南极非线性敏感度, unit: "m SLE/(yr·K^1.5)", default: 0.0002, min: 0.0001, max: 0.0006, source: "DeConto/AR6 量级", impl: v0 }
- { id: lw_rate, symbol: "s_lw", name_zh: 陆地水储量变化率, unit: "m/yr", default: 0.0003, min: 0.0001, max: 0.0005, source: "水库蓄水-地下水开采净效应", impl: v0 }
```

- [ ] **Step 2: 写测试**

`packages/spec/src/parameters.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { loadSpec } from "./index.js";

describe("parameters", () => {
  it("v0 参数默认值都在先验范围内", () => {
    for (const p of loadSpec().parameters) {
      if (p.impl !== "v0") continue;
      expect(p.default, p.id).toBeGreaterThanOrEqual(p.min);
      expect(p.default, p.id).toBeLessThanOrEqual(p.max);
    }
  });
  it("id 唯一", () => {
    const ids = loadSpec().parameters.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 3: 运行并提交**

Run: `pnpm --filter @future-earth/spec test` — Expected: 全部 passed

```bash
git add packages/spec
git commit -m "feat(spec): v0 全部 23 个可调参数与文献先验"
```

---

### Task 4: scenarios.yaml（四情景完整锚点表）

**Files:**
- Create: `packages/spec/src/spec/scenarios.yaml`
- Test: `packages/spec/src/scenarios.test.ts`

- [ ] **Step 1: 写 scenarios.yaml**

`packages/spec/src/spec/scenarios.yaml`:
```yaml
# CO₂ 化石排放锚点 (GtC/yr) 形状取自 Riahi et al. 2017 / GCB 量级；
# 2100 浓度目标 target_co2_2100_ppm 取自 Meinshausen et al. 2020（用于 Task 16 端点校正）
- id: ssp126
  name: SSP1-2.6
  name_zh: 低排放（可持续）
  target_co2_2100_ppm: 445
  co2_emission_anchors_gtc: { 2025: 10.6, 2035: 9.0, 2050: 5.0, 2070: 1.0, 2085: -1.0, 2100: -2.0, 2150: -3.0, 2200: -3.0, 2500: -3.0 }
  luluc_anchors_gtc: { 2025: 1.1, 2050: 0.7, 2100: 0.3, 2500: 0.2 }
  ch4_anchors_ppb: { 2025: 1930, 2050: 1550, 2100: 1200, 2500: 1150 }
  n2o_anchors_ppb: { 2025: 337, 2100: 330, 2500: 325 }
  f_other_anchors_wm2: { 2025: -0.75, 2070: -0.35, 2500: -0.30 }
  land_water_rate_m_yr: 0.00015
- id: ssp245
  name: SSP2-4.5
  name_zh: 中排放（中间路线）
  target_co2_2100_ppm: 603
  co2_emission_anchors_gtc: { 2025: 10.8, 2040: 11.5, 2060: 10.0, 2080: 7.0, 2100: 5.0, 2150: 3.5, 2200: 3.0, 2300: 2.5, 2500: 2.0 }
  luluc_anchors_gtc: { 2025: 1.2, 2050: 1.0, 2100: 0.6, 2500: 0.4 }
  ch4_anchors_ppb: { 2025: 1930, 2050: 1900, 2100: 1850, 2500: 1750 }
  n2o_anchors_ppb: { 2025: 337, 2100: 350, 2500: 340 }
  f_other_anchors_wm2: { 2025: -0.75, 2070: -0.55, 2100: -0.40, 2500: -0.35 }
  land_water_rate_m_yr: 0.0002
- id: ssp370
  name: SSP3-7.0
  name_zh: 中高排放（区域竞争）
  target_co2_2100_ppm: 867
  co2_emission_anchors_gtc: { 2025: 11.0, 2035: 13.0, 2050: 17.0, 2070: 21.0, 2090: 23.5, 2100: 24.0, 2150: 26.0, 2200: 27.0, 2300: 26.0, 2500: 24.0 }
  luluc_anchors_gtc: { 2025: 1.3, 2050: 1.5, 2100: 1.0, 2500: 0.6 }
  ch4_anchors_ppb: { 2025: 1930, 2050: 2300, 2100: 2600, 2500: 2400 }
  n2o_anchors_ppb: { 2025: 337, 2100: 400, 2500: 390 }
  f_other_anchors_wm2: { 2025: -0.80, 2070: -0.85, 2100: -0.85, 2500: -0.70 }
  land_water_rate_m_yr: 0.0002
- id: ssp585
  name: SSP5-8.5
  name_zh: 高排放（化石燃料发展）
  target_co2_2100_ppm: 1135
  co2_emission_anchors_gtc: { 2025: 11.2, 2040: 17.0, 2060: 24.0, 2080: 29.5, 2100: 33.5, 2150: 36.0, 2200: 37.0, 2300: 36.0, 2400: 34.0, 2500: 32.0 }
  luluc_anchors_gtc: { 2025: 1.2, 2050: 1.4, 2100: 0.9, 2500: 0.5 }
  ch4_anchors_ppb: { 2025: 1930, 2050: 2700, 2100: 3500, 2500: 3300 }
  n2o_anchors_ppb: { 2025: 337, 2100: 450, 2500: 430 }
  f_other_anchors_wm2: { 2025: -0.75, 2070: -0.70, 2100: -0.65, 2300: -0.45, 2500: -0.40 }
  land_water_rate_m_yr: 0.0002
```

- [ ] **Step 2: 写测试**

`packages/spec/src/scenarios.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { loadSpec } from "./index.js";

describe("scenarios", () => {
  it("四情景齐全", () => {
    const ids = loadSpec().scenarios.map((s) => s.id);
    expect(ids).toEqual(["ssp126", "ssp245", "ssp370", "ssp585"]);
  });
  it("锚点年份升序且覆盖 2025-2500", () => {
    for (const s of loadSpec().scenarios) {
      const yrs = Object.keys(s.co2_emission_anchors_gtc).map(Number).sort((a, b) => a - b);
      expect(yrs[0]!, s.id).toBe(2025);
      expect(yrs.at(-1)!, s.id).toBe(2500);
    }
  });
});
```

- [ ] **Step 3: 运行并提交**

Run: `pnpm --filter @future-earth/spec test` — Expected: 全部 passed

```bash
git add packages/spec
git commit -m "feat(spec): 四个 SSP 情景锚点表（2100 浓度目标对齐 Meinshausen 2020）"
```

---

### Task 5: variables.yaml（57 个变量的完整定义）

**Files:**
- Create: `packages/spec/src/spec/variables.yaml`
- Test: `packages/spec/src/variables.test.ts`

- [ ] **Step 1: 写 variables.yaml**

以下为**完整内容**（flow 风格一行一变量；timescale 单位为年）：

```yaml
# ---- forcing（3）----
- { id: solar.irradiance, name_en: Solar Irradiance, name_zh: 太阳辐照度, domain: forcing, unit: "W/m²", spatial: false, state_variable: false, drivers: [], affects: [atmosphere.radiative_forcing], equations: [eq_01], timescale: { min: 1, typical: 11, max: 500 }, data_source: null, impl: v1 }
- { id: volcanic.forcing, name_en: Volcanic Forcing, name_zh: 火山强迫, domain: forcing, unit: "W/m²", spatial: false, state_variable: false, drivers: [], affects: [atmosphere.radiative_forcing], equations: [eq_09], timescale: { min: 1, typical: 2, max: 500 }, data_source: datasets.historical.forcing_natural, impl: v1 }
- { id: aerosol.forcing, name_en: Aerosol Forcing, name_zh: 气溶胶强迫, domain: forcing, unit: "W/m²", spatial: false, state_variable: false, drivers: [human.emissions_fossil], affects: [atmosphere.radiative_forcing], equations: [eq_09], timescale: { min: 1, typical: 10, max: 500 }, data_source: datasets.historical.forcing_natural, impl: v1 }
# ---- atmosphere（7）----
- { id: atmosphere.co2, name_en: Atmospheric CO2, name_zh: 大气CO₂浓度, domain: atmosphere, unit: ppm, spatial: false, state_variable: true, drivers: [human.emissions_fossil, human.emissions_luluc, ocean.carbon_uptake, bio.biomass, cryosphere.permafrost_carbon], affects: [atmosphere.forcing_co2, bio.npp, ocean.carbon_uptake], equations: [eq_15], timescale: { min: 1, typical: 10, max: 500 }, data_source: datasets.historical.co2_concentration, impl: v0 }
- { id: atmosphere.ch4, name_en: Atmospheric CH4, name_zh: 大气甲烷浓度, domain: atmosphere, unit: ppb, spatial: false, state_variable: true, drivers: [human.emissions_fossil, cryosphere.permafrost_carbon], affects: [atmosphere.forcing_ghg], equations: [], timescale: { min: 1, typical: 10, max: 100 }, data_source: null, impl: v0 }
- { id: atmosphere.n2o, name_en: Atmospheric N2O, name_zh: 大气氧化亚氮浓度, domain: atmosphere, unit: ppb, spatial: false, state_variable: true, drivers: [human.emissions_fossil], affects: [atmosphere.forcing_ghg], equations: [], timescale: { min: 1, typical: 10, max: 100 }, data_source: null, impl: v0 }
- { id: atmosphere.forcing_co2, name_en: CO2 Radiative Forcing, name_zh: CO₂辐射强迫, domain: atmosphere, unit: "W/m²", spatial: false, state_variable: false, drivers: [atmosphere.co2], affects: [atmosphere.forcing_ghg], equations: [eq_07], timescale: { min: 1, typical: 10, max: 500 }, data_source: null, impl: v0 }
- { id: atmosphere.forcing_ghg, name_en: Total GHG Forcing, name_zh: 温室气体总强迫, domain: atmosphere, unit: "W/m²", spatial: false, state_variable: false, drivers: [atmosphere.forcing_co2, atmosphere.ch4, atmosphere.n2o], affects: [atmosphere.radiative_forcing], equations: [eq_08], timescale: { min: 1, typical: 10, max: 500 }, data_source: null, impl: v0 }
- { id: atmosphere.forcing_other, name_en: Other ERF, name_zh: 其他有效辐射强迫, domain: atmosphere, unit: "W/m²", spatial: false, state_variable: false, drivers: [], affects: [atmosphere.radiative_forcing], equations: [eq_09], timescale: { min: 1, typical: 10, max: 500 }, data_source: datasets.historical.forcing_natural, impl: v0 }
- { id: atmosphere.temperature, name_en: Global Mean Surface Temperature Anomaly, name_zh: 全球平均表面温度异常, domain: atmosphere, unit: "K", spatial: false, state_variable: true, drivers: [atmosphere.radiative_forcing, ocean.temp_deep, cryosphere.sea_ice_area], affects: [ocean.temp_deep, cryosphere.glacier_mass, cryosphere.greenland_ice, cryosphere.antarctic_ice, hydrosphere.evaporation, downscale.city_climate], equations: [eq_06, eq_11], timescale: { min: 1, typical: 10, max: 500 }, data_source: datasets.historical.temperature, impl: v0 }
# ---- ocean（6）----
- { id: ocean.temp_deep, name_en: Deep Ocean Temperature Anomaly, name_zh: 深海温度异常, domain: ocean, unit: "K", spatial: false, state_variable: true, drivers: [atmosphere.temperature], affects: [atmosphere.temperature, ocean.heat_content, sea.level_thermal], equations: [eq_12], timescale: { min: 10, typical: 100, max: 500 }, data_source: null, impl: v0 }
- { id: ocean.heat_content, name_en: Ocean Heat Content, name_zh: 海洋热含量, domain: ocean, unit: "W·yr/m²", spatial: false, state_variable: true, drivers: [atmosphere.temperature, ocean.temp_deep], affects: [sea.level_thermal], equations: [eq_13], timescale: { min: 10, typical: 50, max: 500 }, data_source: null, impl: v0 }
- { id: ocean.carbon_uptake, name_en: Ocean Carbon Uptake, name_zh: 海洋碳吸收, domain: ocean, unit: "GtC/yr", spatial: false, state_variable: true, drivers: [atmosphere.co2, atmosphere.temperature], affects: [atmosphere.co2], equations: [eq_17], timescale: { min: 1, typical: 10, max: 500 }, data_source: null, impl: v0 }
- { id: ocean.dissolved_co2, name_en: Dissolved Inorganic Carbon, name_zh: 溶解无机碳, domain: ocean, unit: "µmol/kg", spatial: false, state_variable: false, drivers: [atmosphere.co2, ocean.temp_deep], affects: [ocean.carbon_uptake], equations: [], timescale: { min: 10, typical: 100, max: 500 }, data_source: null, impl: v2 }
- { id: ocean.ph, name_en: Ocean pH, name_zh: 海洋pH, domain: ocean, unit: "1", spatial: false, state_variable: false, drivers: [ocean.dissolved_co2], affects: [], equations: [], timescale: { min: 10, typical: 100, max: 500 }, data_source: null, impl: v3 }
- { id: ocean.circulation, name_en: Ocean Circulation Strength, name_zh: 海洋环流强度, domain: ocean, unit: "Sv", spatial: false, state_variable: false, drivers: [atmosphere.temperature], affects: [ocean.carbon_uptake], equations: [], timescale: { min: 50, typical: 200, max: 500 }, data_source: null, impl: v3 }
# ---- sea（5）----
- { id: sea.level, name_en: Global Mean Sea Level Rise, name_zh: 全球平均海平面上升, domain: ocean, unit: "m", spatial: false, state_variable: true, drivers: [sea.level_thermal, sea.level_glacier, sea.level_ice_sheet, sea.level_land_water], affects: [surface.inundation_mask, geosphere.coastline_position], equations: [eq_31, eq_32], timescale: { min: 10, typical: 100, max: 500 }, data_source: null, impl: v0 }
- { id: sea.level_thermal, name_en: Thermal Expansion SLR, name_zh: 热膨胀海平面上升, domain: ocean, unit: "m", spatial: false, state_variable: true, drivers: [ocean.heat_content, ocean.temp_deep], affects: [sea.level], equations: [eq_14], timescale: { min: 10, typical: 100, max: 500 }, data_source: null, impl: v0 }
- { id: sea.level_glacier, name_en: Glacier SLR, name_zh: 冰川消融海平面上升, domain: cryosphere, unit: "m", spatial: false, state_variable: true, drivers: [atmosphere.temperature], affects: [sea.level], equations: [eq_25, eq_26], timescale: { min: 10, typical: 50, max: 300 }, data_source: null, impl: v0 }
- { id: sea.level_ice_sheet, name_en: Ice Sheet SLR, name_zh: 冰盖消融海平面上升, domain: cryosphere, unit: "m", spatial: false, state_variable: true, drivers: [atmosphere.temperature], affects: [sea.level], equations: [eq_27], timescale: { min: 50, typical: 200, max: 500 }, data_source: null, impl: v0 }
- { id: sea.level_land_water, name_en: Land Water SLR, name_zh: 陆地水储量海平面上升, domain: hydrosphere, unit: "m", spatial: false, state_variable: true, drivers: [], affects: [sea.level], equations: [eq_31], timescale: { min: 10, typical: 50, max: 500 }, data_source: null, impl: v0 }
# ---- cryosphere（6）----
- { id: cryosphere.glacier_mass, name_en: Mountain Glacier Mass, name_zh: 山地冰川质量, domain: cryosphere, unit: "m SLE", spatial: false, state_variable: true, drivers: [atmosphere.temperature], affects: [sea.level_glacier], equations: [eq_25, eq_26], timescale: { min: 10, typical: 50, max: 300 }, data_source: null, impl: v0 }
- { id: cryosphere.greenland_ice, name_en: Greenland Ice Sheet Mass, name_zh: 格陵兰冰盖质量, domain: cryosphere, unit: "m SLE", spatial: false, state_variable: true, drivers: [atmosphere.temperature], affects: [sea.level_ice_sheet], equations: [eq_27], timescale: { min: 50, typical: 200, max: 500 }, data_source: null, impl: v0 }
- { id: cryosphere.antarctic_ice, name_en: Antarctic Ice Sheet Mass, name_zh: 南极冰盖质量, domain: cryosphere, unit: "m SLE", spatial: false, state_variable: true, drivers: [atmosphere.temperature], affects: [sea.level_ice_sheet], equations: [eq_27], timescale: { min: 50, typical: 200, max: 500 }, data_source: null, impl: v0 }
- { id: cryosphere.sea_ice_area, name_en: Sea Ice Area, name_zh: 海冰面积, domain: cryosphere, unit: "10⁶ km²", spatial: true, state_variable: true, drivers: [ocean.temp_deep, atmosphere.temperature], affects: [atmosphere.radiative_forcing], equations: [eq_28], timescale: { min: 1, typical: 10, max: 100 }, data_source: null, impl: v1 }
- { id: cryosphere.snow_mass, name_en: Snow Mass, name_zh: 积雪量, domain: cryosphere, unit: "10³ km³", spatial: true, state_variable: true, drivers: [hydrosphere.precipitation, atmosphere.temperature], affects: [atmosphere.radiative_forcing], equations: [eq_24], timescale: { min: 1, typical: 1, max: 10 }, data_source: null, impl: v1 }
- { id: cryosphere.permafrost_carbon, name_en: Permafrost Carbon, name_zh: 冻土碳储量, domain: cryosphere, unit: "GtC", spatial: true, state_variable: true, drivers: [atmosphere.temperature], affects: [atmosphere.co2, atmosphere.ch4], equations: [eq_39, eq_40], timescale: { min: 50, typical: 200, max: 500 }, data_source: null, impl: v2 }
# ---- hydrosphere（6）----
- { id: hydrosphere.precipitation, name_en: Precipitation, name_zh: 降水量, domain: hydrosphere, unit: "mm/yr", spatial: true, state_variable: true, drivers: [hydrosphere.evaporation], affects: [hydrosphere.runoff, pedo.soil_moisture, bio.npp, hydrosphere.river_discharge], equations: [eq_19, eq_52], timescale: { min: 1, typical: 10, max: 500 }, data_source: null, impl: v1 }
- { id: hydrosphere.evaporation, name_en: Evaporation, name_zh: 蒸发量, domain: hydrosphere, unit: "mm/yr", spatial: true, state_variable: true, drivers: [atmosphere.temperature], affects: [hydrosphere.precipitation, pedo.soil_moisture], equations: [eq_20], timescale: { min: 1, typical: 10, max: 500 }, data_source: null, impl: v1 }
- { id: hydrosphere.runoff, name_en: Surface Runoff, name_zh: 地表径流, domain: hydrosphere, unit: "mm/yr", spatial: true, state_variable: true, drivers: [hydrosphere.precipitation, pedo.soil_moisture], affects: [geosphere.sediment_flux, hydrosphere.river_discharge], equations: [eq_22], timescale: { min: 1, typical: 1, max: 10 }, data_source: null, impl: v1 }
- { id: hydrosphere.soil_moisture, name_en: Soil Moisture, name_zh: 土壤水分, domain: pedosphere, unit: "mm", spatial: true, state_variable: true, drivers: [hydrosphere.precipitation, hydrosphere.evaporation], affects: [bio.vegetation_fraction, bio.fire_probability], equations: [eq_23], timescale: { min: 1, typical: 1, max: 10 }, data_source: null, impl: v1 }
- { id: hydrosphere.groundwater, name_en: Groundwater Storage, name_zh: 地下水储量, domain: hydrosphere, unit: "mm", spatial: true, state_variable: true, drivers: [hydrosphere.soil_moisture], affects: [hydrosphere.runoff], equations: [eq_23], timescale: { min: 1, typical: 10, max: 100 }, data_source: null, impl: v1 }
- { id: hydrosphere.river_discharge, name_en: River Discharge, name_zh: 河流流量, domain: geosphere, unit: "km³/yr", spatial: true, state_variable: true, drivers: [hydrosphere.runoff, hydrosphere.precipitation], affects: [geosphere.sediment_flux], equations: [eq_46], timescale: { min: 1, typical: 1, max: 10 }, data_source: null, impl: v3 }
# ---- biosphere（5）----
- { id: bio.vegetation_fraction, name_en: Vegetation Fraction, name_zh: 植被覆盖率, domain: biosphere, unit: "0-1", spatial: true, state_variable: true, drivers: [atmosphere.co2, hydrosphere.soil_moisture, bio.fire_probability, human.land_use], affects: [bio.npp, pedo.erosion_rate, atmosphere.co2], equations: [eq_33, eq_35], timescale: { min: 1, typical: 50, max: 500 }, data_source: null, impl: v2 }
- { id: bio.biomass, name_en: Biomass, name_zh: 生物量碳库, domain: biosphere, unit: "GtC", spatial: false, state_variable: true, drivers: [bio.npp, bio.fire_probability], affects: [atmosphere.co2, bio.fire_probability], equations: [eq_18], timescale: { min: 1, typical: 50, max: 500 }, data_source: null, impl: v2 }
- { id: bio.npp, name_en: Net Primary Productivity, name_zh: 净初级生产力, domain: biosphere, unit: "GtC/yr", spatial: true, state_variable: false, drivers: [atmosphere.co2, bio.vegetation_fraction, hydrosphere.precipitation], affects: [bio.biomass, pedo.soil_carbon], equations: [eq_36], timescale: { min: 1, typical: 10, max: 500 }, data_source: null, impl: v2 }
- { id: bio.fire_probability, name_en: Fire Probability, name_zh: 火灾概率, domain: biosphere, unit: "0-1", spatial: true, state_variable: false, drivers: [atmosphere.temperature, bio.biomass, hydrosphere.soil_moisture], affects: [bio.biomass, atmosphere.co2, bio.vegetation_fraction], equations: [eq_37, eq_38], timescale: { min: 1, typical: 1, max: 10 }, data_source: null, impl: v2 }
- { id: bio.biome_class, name_en: Biome Class, name_zh: 生物群系类型, domain: biosphere, unit: "class", spatial: true, state_variable: true, drivers: [downscale.city_climate, hydrosphere.precipitation], affects: [surface.land_cover], equations: [eq_50], timescale: { min: 10, typical: 100, max: 500 }, data_source: datasets.static.baseline_climate, impl: v0 }
# ---- pedosphere（3）----
- { id: pedo.soil_carbon, name_en: Soil Organic Carbon, name_zh: 土壤有机碳, domain: pedosphere, unit: "GtC", spatial: true, state_variable: true, drivers: [bio.npp], affects: [atmosphere.co2], equations: [eq_16], timescale: { min: 10, typical: 100, max: 500 }, data_source: null, impl: v2 }
- { id: pedo.soil_depth, name_en: Soil Depth, name_zh: 土壤深度, domain: pedosphere, unit: "m", spatial: true, state_variable: true, drivers: [pedo.erosion_rate], affects: [bio.vegetation_fraction], equations: [eq_47], timescale: { min: 100, typical: 500, max: 500 }, data_source: null, impl: v3 }
- { id: pedo.erosion_rate, name_en: Erosion Rate, name_zh: 侵蚀速率, domain: pedosphere, unit: "mm/yr", spatial: true, state_variable: false, drivers: [hydrosphere.runoff, bio.vegetation_fraction], affects: [geosphere.elevation, geosphere.sediment_flux], equations: [eq_43, eq_44], timescale: { min: 10, typical: 100, max: 500 }, data_source: null, impl: v3 }
# ---- geosphere（6）----
- { id: geo.elevation, name_en: Elevation, name_zh: 地表高程, domain: geosphere, unit: "m", spatial: true, state_variable: true, drivers: [pedo.erosion_rate, geosphere.sediment_flux], affects: [geo.slope, surface.inundation_mask], equations: [eq_41, eq_47, eq_49], timescale: { min: 100, typical: 500, max: 500 }, data_source: datasets.static.dem, impl: v0 }
- { id: geo.slope, name_en: Slope, name_zh: 坡度, domain: geosphere, unit: "m/m", spatial: true, state_variable: false, drivers: [geo.elevation], affects: [pedo.erosion_rate, geosphere.sediment_flux], equations: [eq_41, eq_42], timescale: { min: 100, typical: 500, max: 500 }, data_source: null, impl: v3 }
- { id: geo.sediment_flux, name_en: Sediment Flux, name_zh: 输沙通量, domain: geosphere, unit: "Gt/yr", spatial: true, state_variable: true, drivers: [hydrosphere.runoff, hydrosphere.river_discharge, pedo.erosion_rate], affects: [geo.elevation], equations: [eq_45, eq_46], timescale: { min: 10, typical: 100, max: 500 }, data_source: null, impl: v3 }
- { id: geo.coastline_position, name_en: Coastline Position, name_zh: 海岸线位置, domain: geosphere, unit: "m", spatial: true, state_variable: true, drivers: [sea.level, geo.elevation], affects: [surface.land_cover], equations: [eq_48, eq_49], timescale: { min: 10, typical: 100, max: 500 }, data_source: null, impl: v3 }
- { id: geo.landmask, name_en: Land Mask, name_zh: 陆地掩膜, domain: geosphere, unit: "0/1", spatial: true, state_variable: false, drivers: [geo.elevation, sea.level], affects: [surface.land_cover], equations: [eq_49], timescale: { min: 10, typical: 100, max: 500 }, data_source: datasets.static.dem, impl: v3 }
- { id: geo.landform_class, name_en: Landform Class, name_zh: 地貌类型, domain: geosphere, unit: "class", spatial: true, state_variable: true, drivers: [geo.slope, geo.elevation, hydrosphere.river_discharge], affects: [surface.land_cover], equations: [eq_47], timescale: { min: 100, typical: 500, max: 500 }, data_source: null, impl: v3 }
# ---- human（6）----
- { id: human.emissions_fossil, name_en: Fossil CO2 Emissions, name_zh: 化石碳排放, domain: human, unit: "GtC/yr", spatial: false, state_variable: false, drivers: [human.energy_use], affects: [atmosphere.co2, aerosol.forcing], equations: [eq_15], timescale: { min: 1, typical: 10, max: 500 }, data_source: datasets.historical.emissions, impl: v0 }
- { id: human.emissions_luluc, name_en: LULUC Emissions, name_zh: 土地利用碳排放, domain: human, unit: "GtC/yr", spatial: false, state_variable: false, drivers: [human.land_use], affects: [atmosphere.co2, bio.vegetation_fraction], equations: [eq_15], timescale: { min: 1, typical: 10, max: 500 }, data_source: datasets.historical.emissions, impl: v0 }
- { id: human.population, name_en: Population, name_zh: 人口, domain: human, unit: "10⁹", spatial: true, state_variable: false, drivers: [], affects: [human.energy_use, human.land_use], equations: [], timescale: { min: 1, typical: 50, max: 500 }, data_source: null, impl: v1 }
- { id: human.energy_use, name_en: Energy Use, name_zh: 能源消费, domain: human, unit: "EJ/yr", spatial: false, state_variable: false, drivers: [human.population], affects: [human.emissions_fossil], equations: [], timescale: { min: 1, typical: 10, max: 500 }, data_source: null, impl: v1 }
- { id: human.land_use, name_en: Land Use, name_zh: 土地利用, domain: human, unit: "class", spatial: true, state_variable: false, drivers: [human.population], affects: [human.emissions_luluc, bio.vegetation_fraction], equations: [], timescale: { min: 1, typical: 50, max: 500 }, data_source: null, impl: v1 }
- { id: human.adaptation, name_en: Adaptation Capacity, name_zh: 适应能力, domain: human, unit: "index", spatial: true, state_variable: false, drivers: [human.population], affects: [surface.inundation_mask], equations: [], timescale: { min: 1, typical: 50, max: 500 }, data_source: null, impl: v3 }
# ---- downscale（2）+ surface（2）----
- { id: downscale.warming_pattern, name_en: Zonal Warming Pattern, name_zh: 纬度带升温放大系数, domain: atmosphere, unit: "1", spatial: true, state_variable: false, drivers: [], affects: [downscale.city_climate], equations: [eq_51], timescale: { min: 1, typical: 50, max: 500 }, data_source: datasets.static.warming_pattern, impl: v0 }
- { id: downscale.city_climate, name_en: City Climate, name_zh: 城市气候状态, domain: surface, unit: "K, mm/yr", spatial: true, state_variable: false, drivers: [atmosphere.temperature, downscale.warming_pattern, hydrosphere.precipitation], affects: [bio.biome_class], equations: [eq_51, eq_52], timescale: { min: 1, typical: 50, max: 500 }, data_source: datasets.static.cities, impl: v0 }
- { id: surface.land_cover, name_en: Land Cover, name_zh: 地表覆盖, domain: surface, unit: "class", spatial: true, state_variable: true, drivers: [bio.biome_class, geo.coastline_position, surface.inundation_mask], affects: [], equations: [eq_50], timescale: { min: 10, typical: 100, max: 500 }, data_source: null, impl: v1 }
- { id: surface.inundation_mask, name_en: Inundation Mask, name_zh: 淹没掩膜, domain: surface, unit: "0/1", spatial: true, state_variable: false, drivers: [sea.level, geo.elevation, human.adaptation], affects: [surface.land_cover], equations: [eq_49, eq_53], timescale: { min: 1, typical: 100, max: 500 }, data_source: datasets.static.cities, impl: v0 }
```

- [ ] **Step 2: 写测试**

`packages/spec/src/variables.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { loadSpec } from "./index.js";

describe("variables", () => {
  const spec = loadSpec();
  const varIds = new Set(spec.variables.map((v) => v.id));
  const domainIds = new Set(spec.ontology.domains.map((d) => d.id));

  it("变量数 = 57 且 id 唯一", () => {
    expect(spec.variables).toHaveLength(57);
    expect(varIds.size).toBe(57);
  });
  it("domain 字段必须指向本体域", () => {
    for (const v of spec.variables) expect(domainIds.has(v.domain), v.id).toBe(true);
  });
  it("drivers/affects 引用必须可解析", () => {
    for (const v of spec.variables) {
      for (const d of [...v.drivers, ...v.affects]) expect(varIds.has(d), `${v.id}→${d}`).toBe(true);
    }
  });
});
```

- [ ] **Step 3: 运行并提交**

Run: `pnpm --filter @future-earth/spec test` — Expected: 全部 passed（任何引用错都会被测试抓住，按报错修正 YAML 中对应 id）

```bash
git add packages/spec
git commit -m "feat(spec): 57 个变量完整定义（域/单位/因果引用/时间尺度/实现分级）"
```

---

### Task 6: equations.yaml（53 个方程的完整定义）

**Files:**
- Create: `packages/spec/src/spec/equations.yaml`
- Test: `packages/spec/src/equations.test.ts`

- [ ] **Step 1: 写 equations.yaml**

完整内容（formula 为可读数学式；v0 方程的 formula 即引擎实现契约）：

```yaml
# ---- 第 1 组：辐射与能量平衡（v1 显式化；v0 由 forcing 数据 + 两层 EBM 隐式涵盖）----
- { id: eq_01, name_en: Incoming Solar, name_zh: 太阳入射, domain: forcing, formula: "Q_in = (S0/4)(1+δS)", inputs: [solar.irradiance], outputs: [atmosphere.radiative_forcing], parameters: [], notes: "", impl: v1 }
- { id: eq_02, name_en: Reflected Solar, name_zh: 反射太阳辐射, domain: forcing, formula: "Q_ref = α·Q_in", inputs: [cryosphere.sea_ice_area, cryosphere.snow_mass], outputs: [atmosphere.radiative_forcing], parameters: [], notes: "", impl: v1 }
- { id: eq_03, name_en: Absorbed Solar, name_zh: 吸收太阳辐射, domain: forcing, formula: "Q_abs = (1-α)·Q_in", inputs: [solar.irradiance], outputs: [atmosphere.radiative_forcing], parameters: [], notes: "", impl: v1 }
- { id: eq_04, name_en: Outgoing Longwave, name_zh: 射出长波, domain: forcing, formula: "Q_out = ε·σ·Te⁴", inputs: [atmosphere.temperature], outputs: [atmosphere.radiative_forcing], parameters: [], notes: "", impl: v1 }
- { id: eq_05, name_en: Net Radiation, name_zh: 净辐射, domain: forcing, formula: "N = Q_abs - Q_out", inputs: [], outputs: [atmosphere.radiative_forcing], parameters: [], notes: "", impl: v1 }
# ---- 第 2 组：温度 ----
- { id: eq_06, name_en: Global Mean Temperature, name_zh: 全球平均温度, domain: atmosphere, formula: "Ca·dTa/dt = N - λ·Ta", inputs: [atmosphere.radiative_forcing], outputs: [atmosphere.temperature], parameters: [lambda], notes: "v0 为两层形式下的表层诊断", impl: v0 }
- { id: eq_07, name_en: CO2 Forcing, name_zh: CO₂辐射强迫, domain: atmosphere, formula: "F_CO2 = 5.35·ln(C/C0)", inputs: [atmosphere.co2], outputs: [atmosphere.forcing_co2], parameters: [c0_ref], notes: "Myhre 1998", impl: v0 }
- { id: eq_08, name_en: GHG Forcing, name_zh: 温室气体总强迫, domain: atmosphere, formula: "F_GHG = F_CO2 + a_CH4·(√M-√M0) + a_N2O·(√N-√N0)", inputs: [atmosphere.forcing_co2, atmosphere.ch4, atmosphere.n2o], outputs: [atmosphere.forcing_ghg], parameters: [a_ch4, a_n2o, ch4_ref, n2o_ref], notes: "Myhre 简化式", impl: v0 }
- { id: eq_09, name_en: Total Forcing, name_zh: 总辐射强迫, domain: atmosphere, formula: "F_total = F_GHG + F_other", inputs: [atmosphere.forcing_ghg, atmosphere.forcing_other], outputs: [atmosphere.radiative_forcing], parameters: [], notes: "F_other 含火山/太阳/气溶胶/土地利用", impl: v0 }
- { id: eq_10, name_en: Single-Layer Temperature, name_zh: 单层温度响应, domain: atmosphere, formula: "Ca·dTa/dt = F_total - λ·Ta - γ(Ta-To)", inputs: [atmosphere.radiative_forcing], outputs: [atmosphere.temperature], parameters: [lambda, gamma_ocean, c_s], notes: "v0 由 eq_11/12 两层形式涵盖，保留为诊断式", impl: v1 }
# ---- 第 3 组：海洋（两层 EBM）----
- { id: eq_11, name_en: Surface Layer Energy, name_zh: 表层能量平衡, domain: ocean, formula: "Cs·dTs/dt = F_total - λ·Ts - γ·(Ts - Td)", inputs: [atmosphere.radiative_forcing, ocean.temp_deep], outputs: [atmosphere.temperature], parameters: [lambda, gamma_ocean, c_s], notes: "Geoffroy 2013 两层 EBM", impl: v0 }
- { id: eq_12, name_en: Deep Layer Energy, name_zh: 深层能量平衡, domain: ocean, formula: "Cd·dTd/dt = γ·(Ts - Td)", inputs: [atmosphere.temperature], outputs: [ocean.temp_deep], parameters: [gamma_ocean, c_d], notes: "", impl: v0 }
- { id: eq_13, name_en: Ocean Heat Content, name_zh: 海洋热含量, domain: ocean, formula: "H_o = Cs·Ts + Cd·Td", inputs: [atmosphere.temperature, ocean.temp_deep], outputs: [ocean.heat_content], parameters: [c_s, c_d], notes: "诊断量", impl: v0 }
- { id: eq_14, name_en: Thermal Expansion, name_zh: 热膨胀, domain: ocean, formula: "dS_th/dt = k_th·γ·(Ts - Td)", inputs: [atmosphere.temperature, ocean.temp_deep], outputs: [sea.level_thermal], parameters: [k_thermal, gamma_ocean], notes: "k_th 为热膨胀效率", impl: v0 }
# ---- 第 4 组：碳循环 ----
- { id: eq_15, name_en: Atmospheric CO2 Budget, name_zh: 大气碳收支, domain: atmosphere, formula: "dC/dt = (E_fossil + E_luluc - S_land - S_ocean)·κ", inputs: [human.emissions_fossil, human.emissions_luluc, ocean.carbon_uptake, bio.biomass], outputs: [atmosphere.co2], parameters: [ppm_per_gtc], notes: "κ=ppm/GtC 换算", impl: v0 }
- { id: eq_16, name_en: Land Sink, name_zh: 陆地碳汇, domain: biosphere, formula: "S_land = β_L·ln(C/C0)", inputs: [atmosphere.co2], outputs: [atmosphere.co2], parameters: [beta_land, c0_ref], notes: "CO₂ 施肥；v2 扩展为 NPP-Rh", impl: v0 }
- { id: eq_17, name_en: Ocean Sink, name_zh: 海洋碳汇, domain: ocean, formula: "S_ocean = k_oc·(C - C0) - χ·Ts", inputs: [atmosphere.co2, atmosphere.temperature], outputs: [ocean.carbon_uptake], parameters: [k_ocean, chi_temp, c0_ref], notes: "含溶解度温度反馈", impl: v0 }
- { id: eq_18, name_en: Biomass Budget, name_zh: 生物量碳收支, domain: biosphere, formula: "dB/dt = NPP - R_plant - Fire", inputs: [bio.npp, bio.fire_probability], outputs: [bio.biomass], parameters: [], notes: "", impl: v2 }
# ---- 第 5 组：水循环（v1）----
- { id: eq_19, name_en: Precipitation, name_zh: 降水, domain: hydrosphere, formula: "P = f(T, q, Ocean, Circulation)", inputs: [hydrosphere.evaporation], outputs: [hydrosphere.precipitation], parameters: [], notes: "", impl: v1 }
- { id: eq_20, name_en: Evaporation, name_zh: 蒸发, domain: hydrosphere, formula: "E = ke·(qs - qa)", inputs: [atmosphere.temperature], outputs: [hydrosphere.evaporation], parameters: [], notes: "", impl: v1 }
- { id: eq_21, name_en: Water Balance, name_zh: 水量平衡, domain: hydrosphere, formula: "dW/dt = P - E - R", inputs: [], outputs: [hydrosphere.soil_moisture], parameters: [], notes: "", impl: v1 }
- { id: eq_22, name_en: Runoff, name_zh: 径流, domain: hydrosphere, formula: "R = P - E - I", inputs: [hydrosphere.precipitation], outputs: [hydrosphere.runoff], parameters: [], notes: "I=入渗", impl: v1 }
- { id: eq_23, name_en: Soil Water, name_zh: 土壤水, domain: pedosphere, formula: "dWs/dt = P - ET - I + Capillary", inputs: [hydrosphere.precipitation], outputs: [hydrosphere.soil_moisture], parameters: [], notes: "", impl: v1 }
# ---- 第 6 组：冰雪 ----
- { id: eq_24, name_en: Snow Budget, name_zh: 积雪收支, domain: cryosphere, formula: "dMsnow/dt = Psnow - Melt", inputs: [hydrosphere.precipitation], outputs: [cryosphere.snow_mass], parameters: [], notes: "", impl: v1 }
- { id: eq_25, name_en: Glacier Mass Balance, name_zh: 冰川质量平衡, domain: cryosphere, formula: "dMg/dt = Accumulation - Ablation", inputs: [atmosphere.temperature], outputs: [cryosphere.glacier_mass], parameters: [], notes: "v0 为全球聚合箱", impl: v0 }
- { id: eq_26, name_en: Degree-Day Melt, name_zh: 度日融化, domain: cryosphere, formula: "dsG/dt = k_g·max(A_g·Ts, 0)·max(1 - sG/G0, 0)", inputs: [atmosphere.temperature], outputs: [sea.level_glacier], parameters: [k_glacier, amp_glacier, g0_glacier], notes: "DDF 思想的聚合实现", impl: v0 }
- { id: eq_27, name_en: Ice Sheet Mass, name_zh: 冰盖质量, domain: cryosphere, formula: "GrIS: ds/dt = b0 + b1·Δ + b2·Δ² (Δ=A_Gr·Ts); AIS: ds/dt = c0 + c1·Ts^1.5", inputs: [atmosphere.temperature], outputs: [sea.level_ice_sheet], parameters: [b0_gris, b1_gris, b2_gris, amp_gris, c0_ais, c1_ais], notes: "简化 SMB+动力项", impl: v0 }
- { id: eq_28, name_en: Sea Ice Area, name_zh: 海冰面积, domain: cryosphere, formula: "dA/dt = f(To, Ta, A)", inputs: [atmosphere.temperature, ocean.temp_deep], outputs: [cryosphere.sea_ice_area], parameters: [], notes: "经验/logistic", impl: v1 }
# ---- 第 7 组：冰-反照率反馈（v1）----
- { id: eq_29, name_en: Surface Albedo, name_zh: 地表反照率, domain: forcing, formula: "α = α0 + ki·Aice + ks·Asnow - kv·V", inputs: [cryosphere.sea_ice_area, cryosphere.snow_mass, bio.vegetation_fraction], outputs: [atmosphere.radiative_forcing], parameters: [], notes: "", impl: v1 }
- { id: eq_30, name_en: Ice-Albedo Feedback, name_zh: 冰-反照率反馈, domain: forcing, formula: "Ice↓ ⇒ α↓ ⇒ Qabs↑ ⇒ T↑ ⇒ Ice↓", inputs: [atmosphere.temperature], outputs: [atmosphere.temperature], parameters: [], notes: "结构关系（回路 L2）", impl: v1 }
# ---- 第 8 组：海平面 ----
- { id: eq_31, name_en: Sea Level Sum, name_zh: 海平面加总, domain: ocean, formula: "S = S_th + S_g + S_i + S_lw", inputs: [sea.level_thermal, sea.level_glacier, sea.level_ice_sheet, sea.level_land_water], outputs: [sea.level], parameters: [], notes: "", impl: v0 }
- { id: eq_32, name_en: Sea Level Rate, name_zh: 海平面变率, domain: ocean, formula: "dS/dt = Σ dS_i/dt", inputs: [sea.level_thermal, sea.level_glacier, sea.level_ice_sheet, sea.level_land_water], outputs: [sea.level], parameters: [], notes: "诊断式", impl: v0 }
# ---- 第 9 组：植被（v2）----
- { id: eq_33, name_en: Vegetation Growth, name_zh: 植被增长, domain: biosphere, formula: "Growth = rV·fT·fP·fW·fCO2", inputs: [atmosphere.co2, hydrosphere.soil_moisture], outputs: [bio.vegetation_fraction], parameters: [], notes: "", impl: v2 }
- { id: eq_34, name_en: Vegetation Death, name_zh: 植被死亡, domain: biosphere, formula: "Death = mV + Drought + HeatStress + Fire", inputs: [bio.fire_probability], outputs: [bio.vegetation_fraction], parameters: [], notes: "", impl: v2 }
- { id: eq_35, name_en: Vegetation Dynamics, name_zh: 植被动态, domain: biosphere, formula: "dV/dt = Growth - Death", inputs: [], outputs: [bio.vegetation_fraction], parameters: [], notes: "", impl: v2 }
- { id: eq_36, name_en: NPP, name_zh: 净初级生产力, domain: biosphere, formula: "NPP = V·NPPmax·fT·fP·fCO2", inputs: [atmosphere.co2, bio.vegetation_fraction, hydrosphere.precipitation], outputs: [bio.npp], parameters: [], notes: "", impl: v2 }
# ---- 第 10 组：火灾（v2）----
- { id: eq_37, name_en: Fire Probability, name_zh: 火灾概率, domain: biosphere, formula: "P_fire = σ(aT + b·Drought + c·Fuel - d·Humidity)", inputs: [atmosphere.temperature, bio.biomass, hydrosphere.soil_moisture], outputs: [bio.fire_probability], parameters: [], notes: "", impl: v2 }
- { id: eq_38, name_en: Fire Loss, name_zh: 火灾损失, domain: biosphere, formula: "FireLoss = P_fire·Biomass", inputs: [bio.fire_probability, bio.biomass], outputs: [bio.biomass], parameters: [], notes: "", impl: v2 }
# ---- 第 11 组：冻土（v2）----
- { id: eq_39, name_en: Permafrost Thaw, name_zh: 冻土融化, domain: cryosphere, formula: "dM_pf/dt = Freeze - Thaw, Thaw = k_pf·(T-T_pf)+", inputs: [atmosphere.temperature], outputs: [cryosphere.permafrost_carbon], parameters: [], notes: "", impl: v2 }
- { id: eq_40, name_en: Permafrost Carbon Release, name_zh: 冻土碳释放, domain: cryosphere, formula: "E_pf = r_pf·M_pf_thawed", inputs: [cryosphere.permafrost_carbon], outputs: [atmosphere.co2, atmosphere.ch4], parameters: [], notes: "", impl: v2 }
# ---- 第 12 组：地貌（v3）----
- { id: eq_41, name_en: Slope, name_zh: 坡度, domain: geosphere, formula: "Slope = |∇Z|", inputs: [geo.elevation], outputs: [geo.slope], parameters: [], notes: "", impl: v3 }
- { id: eq_42, name_en: River Erosion, name_zh: 河流侵蚀, domain: geosphere, formula: "E_river = K·Q^m·S^n", inputs: [hydrosphere.river_discharge, geo.slope], outputs: [pedo.erosion_rate], parameters: [], notes: "", impl: v3 }
- { id: eq_43, name_en: Surface Erosion, name_zh: 地表侵蚀, domain: pedosphere, formula: "E_soil = Kr·R + Kw·W + Ks·Wind", inputs: [hydrosphere.runoff], outputs: [pedo.erosion_rate], parameters: [], notes: "", impl: v3 }
- { id: eq_44, name_en: Vegetation Erosion Shield, name_zh: 植被抗侵蚀, domain: pedosphere, formula: "E_eff = E_soil·(1 - c·V)", inputs: [bio.vegetation_fraction], outputs: [pedo.erosion_rate], parameters: [], notes: "", impl: v3 }
- { id: eq_45, name_en: Sediment Budget, name_zh: 沉积收支, domain: geosphere, formula: "dSed/dt = T_in - T_out", inputs: [], outputs: [geo.sediment_flux], parameters: [], notes: "", impl: v3 }
- { id: eq_46, name_en: Sediment Transport, name_zh: 河流输沙, domain: geosphere, formula: "Q_sed = Ks·Q^a·S^b", inputs: [hydrosphere.river_discharge, geo.slope], outputs: [geo.sediment_flux], parameters: [], notes: "", impl: v3 }
- { id: eq_47, name_en: Elevation Change, name_zh: 高程变化, domain: geosphere, formula: "dZ/dt = Deposition - Erosion", inputs: [geo.sediment_flux, pedo.erosion_rate], outputs: [geo.elevation], parameters: [], notes: "", impl: v3 }
- { id: eq_48, name_en: Coastal Erosion, name_zh: 海岸侵蚀, domain: geosphere, formula: "E_coast = Kw·Wave^a·Storm^b·SLR^c", inputs: [sea.level], outputs: [geo.coastline_position], parameters: [], notes: "", impl: v3 }
# ---- 第 13 组：淹没与群系（v0 城市级 / v3 全网格）----
- { id: eq_49, name_en: Inundation, name_zh: 淹没判定, domain: surface, formula: "Land(x,y,t) = 1 if Z(x,y) > S(t) else 0", inputs: [sea.level, geo.elevation], outputs: [surface.inundation_mask], parameters: [], notes: "v0 为城市点级；v3 为全网格", impl: v0 }
- { id: eq_50, name_en: Biome Classification, name_zh: 生物群系判定, domain: biosphere, formula: "Biome = argmax_i Suitability_i(T, P)", inputs: [downscale.city_climate, hydrosphere.precipitation], outputs: [bio.biome_class], parameters: [], notes: "v0 为城市级温湿查表；v3 扩展土壤项", impl: v0 }
# ---- 第 14 组：降尺度（v0 新增）----
- { id: eq_51, name_en: Temperature Pattern Scaling, name_zh: 温度模式缩放, domain: atmosphere, formula: "ΔT(x,t) = ΔT_global(t)·Π(lat(x))", inputs: [atmosphere.temperature, downscale.warming_pattern], outputs: [downscale.city_climate], parameters: [], notes: "Pattern Scaling，IPCC AR6 标准技术", impl: v0 }
- { id: eq_52, name_en: Precipitation Scaling, name_zh: 降水标量缩放, domain: hydrosphere, formula: "P(x,t) = P0(x)·(1 + 0.02·ΔT_global(t))", inputs: [atmosphere.temperature], outputs: [downscale.city_climate], parameters: [], notes: "v0 仅全球标量，区域格局 v1", impl: v0 }
- { id: eq_53, name_en: City Inundation, name_zh: 城市淹没判定, domain: surface, formula: "flooded(city,t) = elevation(city) ≤ SLR(t)", inputs: [sea.level, geo.elevation], outputs: [surface.inundation_mask], parameters: [], notes: "城市点级判定", impl: v0 }
```

- [ ] **Step 2: 写测试**

`packages/spec/src/equations.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { loadSpec } from "./index.js";

describe("equations", () => {
  const spec = loadSpec();
  const varIds = new Set(spec.variables.map((v) => v.id));
  const paramIds = new Set(spec.parameters.map((p) => p.id));

  it("方程数 = 53 且 id 唯一且为 eq_01..eq_53", () => {
    expect(spec.equations).toHaveLength(53);
    const ids = spec.equations.map((e) => e.id);
    expect(new Set(ids).size).toBe(53);
    expect(ids).toEqual(Array.from({ length: 53 }, (_, i) => `eq_${String(i + 1).padStart(2, "0")}`));
  });
  it("inputs/outputs 引用的变量必须存在", () => {
    for (const e of spec.equations)
      for (const v of [...e.inputs, ...e.outputs]) expect(varIds.has(v), `${e.id}:${v}`).toBe(true);
  });
  it("引用的参数必须在 parameters.yaml 中定义", () => {
    for (const e of spec.equations)
      for (const p of e.parameters) expect(paramIds.has(p), `${e.id}:${p}`).toBe(true);
  });
});
```

- [ ] **Step 3: 运行并提交**

Run: `pnpm --filter @future-earth/spec test` — Expected: 全部 passed

```bash
git add packages/spec
git commit -m "feat(spec): 53 个方程完整定义（公式/输入输出/参数/实现分级）"
```

---

### Task 7: causal_graph.yaml（约 100 条因果边）与 datasets.yaml（13 条数据源目录）

**Files:**
- Create: `packages/spec/src/spec/causal_graph.yaml`
- Create: `packages/spec/src/spec/datasets.yaml`
- Test: `packages/spec/src/causal.test.ts`

- [ ] **Step 1: 写 causal_graph.yaml（完整内容，回路标记 L1~L10 对应 SPEC §4.2 示例与 doc 02 §16）**

```yaml
# ---- 排放→浓度→强迫（L1 温室效应回路）----
- { source: human.population, target: human.energy_use, mechanism: 需求, sign: positive, equation: null, loops: [] }
- { source: human.energy_use, target: human.emissions_fossil, mechanism: 化石燃烧, sign: positive, equation: null, loops: [] }
- { source: human.land_use, target: human.emissions_luluc, mechanism: 毁林, sign: positive, equation: null, loops: [] }
- { source: human.population, target: human.land_use, mechanism: 开垦, sign: positive, equation: null, loops: [] }
- { source: human.emissions_fossil, target: atmosphere.co2, mechanism: 排放, sign: positive, equation: eq_15, loops: [L1] }
- { source: human.emissions_luluc, target: atmosphere.co2, mechanism: 排放, sign: positive, equation: eq_15, loops: [L1] }
- { source: atmosphere.co2, target: atmosphere.forcing_co2, mechanism: 辐射吸收, sign: positive, equation: eq_07, loops: [L1] }
- { source: atmosphere.ch4, target: atmosphere.forcing_ghg, mechanism: 辐射吸收, sign: positive, equation: eq_08, loops: [L1] }
- { source: atmosphere.n2o, target: atmosphere.forcing_ghg, mechanism: 辐射吸收, sign: positive, equation: eq_08, loops: [L1] }
- { source: atmosphere.forcing_co2, target: atmosphere.forcing_ghg, mechanism: 加总, sign: positive, equation: eq_08, loops: [L1] }
- { source: atmosphere.forcing_ghg, target: atmosphere.radiative_forcing, mechanism: 加总, sign: positive, equation: eq_09, loops: [L1] }
- { source: atmosphere.forcing_other, target: atmosphere.radiative_forcing, mechanism: 加总, sign: positive, equation: eq_09, loops: [] }
- { source: solar.irradiance, target: atmosphere.radiative_forcing, mechanism: 太阳输入, sign: positive, equation: eq_09, loops: [] }
- { source: volcanic.forcing, target: atmosphere.radiative_forcing, mechanism: 平流层气溶胶, sign: negative, equation: eq_09, loops: [] }
- { source: aerosol.forcing, target: atmosphere.radiative_forcing, mechanism: 散射遮阳, sign: negative, equation: eq_09, loops: [] }
# ---- 温度核心 ----
- { source: atmosphere.radiative_forcing, target: atmosphere.temperature, mechanism: 能量失衡, sign: positive, equation: eq_11, loops: [] }
- { source: atmosphere.temperature, target: ocean.temp_deep, mechanism: 热交换, sign: positive, equation: eq_12, loops: [L3] }
- { source: ocean.temp_deep, target: atmosphere.temperature, mechanism: 热惯性, sign: negative, equation: eq_11, loops: [L3] }
- { source: atmosphere.temperature, target: ocean.heat_content, mechanism: 热累积, sign: positive, equation: eq_13, loops: [L3] }
# ---- 碳循环反馈 ----
- { source: atmosphere.co2, target: ocean.carbon_uptake, mechanism: 溶解梯度, sign: positive, equation: eq_17, loops: [] }
- { source: atmosphere.temperature, target: ocean.carbon_uptake, mechanism: 溶解度下降, sign: negative, equation: eq_17, loops: [carbon-climate] }
- { source: ocean.carbon_uptake, target: atmosphere.co2, mechanism: 清除, sign: negative, equation: eq_15, loops: [L1] }
- { source: atmosphere.co2, target: bio.npp, mechanism: CO₂施肥, sign: positive, equation: eq_36, loops: [L6] }
- { source: bio.npp, target: bio.biomass, mechanism: 生长, sign: positive, equation: eq_18, loops: [L6] }
- { source: bio.npp, target: pedo.soil_carbon, mechanism: 凋落物, sign: positive, equation: eq_18, loops: [L6] }
- { source: bio.biomass, target: atmosphere.co2, mechanism: 陆地碳汇, sign: negative, equation: eq_16, loops: [L6] }
- { source: pedo.soil_carbon, target: atmosphere.co2, mechanism: 异养呼吸, sign: positive, equation: eq_16, loops: [L6] }
- { source: human.land_use, target: bio.vegetation_fraction, mechanism: 砍伐, sign: negative, equation: null, loops: [L6] }
# ---- 冰雪→海平面（L2 冰反照率 / L4 冰盖回路）----
- { source: atmosphere.temperature, target: cryosphere.glacier_mass, mechanism: 融化, sign: negative, equation: eq_25, loops: [L4] }
- { source: atmosphere.temperature, target: cryosphere.greenland_ice, mechanism: 消融, sign: negative, equation: eq_27, loops: [L2, L4] }
- { source: atmosphere.temperature, target: cryosphere.antarctic_ice, mechanism: 消融, sign: negative, equation: eq_27, loops: [L2, L4] }
- { source: atmosphere.temperature, target: cryosphere.sea_ice_area, mechanism: 融化, sign: negative, equation: eq_28, loops: [L2] }
- { source: atmosphere.temperature, target: cryosphere.snow_mass, mechanism: 融化, sign: negative, equation: eq_24, loops: [L2] }
- { source: cryosphere.sea_ice_area, target: atmosphere.radiative_forcing, mechanism: 反照率, sign: negative, equation: eq_29, loops: [L2] }
- { source: cryosphere.snow_mass, target: atmosphere.radiative_forcing, mechanism: 反照率, sign: negative, equation: eq_29, loops: [L2] }
- { source: cryosphere.glacier_mass, target: sea.level_glacier, mechanism: 融水入海, sign: negative, equation: eq_26, loops: [L4] }
- { source: cryosphere.greenland_ice, target: sea.level_ice_sheet, mechanism: 融水入海, sign: negative, equation: eq_27, loops: [L4] }
- { source: cryosphere.antarctic_ice, target: sea.level_ice_sheet, mechanism: 融水入海, sign: negative, equation: eq_27, loops: [L4] }
- { source: ocean.temp_deep, target: sea.level_thermal, mechanism: 热膨胀, sign: positive, equation: eq_14, loops: [L3] }
- { source: ocean.heat_content, target: sea.level_thermal, mechanism: 热膨胀, sign: positive, equation: eq_14, loops: [L3] }
- { source: sea.level_thermal, target: sea.level, mechanism: 加总, sign: positive, equation: eq_31, loops: [] }
- { source: sea.level_glacier, target: sea.level, mechanism: 加总, sign: positive, equation: eq_31, loops: [] }
- { source: sea.level_ice_sheet, target: sea.level, mechanism: 加总, sign: positive, equation: eq_31, loops: [] }
- { source: sea.level_land_water, target: sea.level, mechanism: 加总, sign: positive, equation: eq_31, loops: [] }
# ---- 冻土（L7）----
- { source: atmosphere.temperature, target: cryosphere.permafrost_carbon, mechanism: 融化, sign: negative, equation: eq_39, loops: [L7] }
- { source: cryosphere.permafrost_carbon, target: atmosphere.co2, mechanism: 碳释放, sign: positive, equation: eq_40, loops: [L7] }
- { source: cryosphere.permafrost_carbon, target: atmosphere.ch4, mechanism: 甲烷释放, sign: positive, equation: eq_40, loops: [L7] }
# ---- 水循环（L5）----
- { source: atmosphere.temperature, target: hydrosphere.evaporation, mechanism: 蒸发加强, sign: positive, equation: eq_20, loops: [L5] }
- { source: hydrosphere.evaporation, target: hydrosphere.precipitation, mechanism: 水汽输送, sign: positive, equation: eq_19, loops: [L5] }
- { source: hydrosphere.precipitation, target: hydrosphere.soil_moisture, mechanism: 入渗, sign: positive, equation: eq_23, loops: [] }
- { source: hydrosphere.precipitation, target: cryosphere.snow_mass, mechanism: 降雪, sign: positive, equation: eq_24, loops: [] }
- { source: hydrosphere.precipitation, target: hydrosphere.runoff, mechanism: 产流, sign: positive, equation: eq_22, loops: [L9] }
- { source: hydrosphere.evaporation, target: hydrosphere.soil_moisture, mechanism: 消耗, sign: negative, equation: eq_23, loops: [] }
- { source: hydrosphere.soil_moisture, target: hydrosphere.runoff, mechanism: 饱和产流, sign: positive, equation: eq_22, loops: [] }
- { source: hydrosphere.soil_moisture, target: hydrosphere.groundwater, mechanism: 补给, sign: positive, equation: eq_23, loops: [] }
- { source: hydrosphere.groundwater, target: hydrosphere.runoff, mechanism: 基流, sign: positive, equation: eq_22, loops: [] }
- { source: hydrosphere.runoff, target: hydrosphere.river_discharge, mechanism: 汇流, sign: positive, equation: null, loops: [L9] }
- { source: hydrosphere.precipitation, target: bio.npp, mechanism: 水分供给, sign: positive, equation: eq_36, loops: [] }
# ---- 植被与火灾（L6/L8）----
- { source: atmosphere.co2, target: bio.vegetation_fraction, mechanism: 施肥, sign: positive, equation: eq_33, loops: [L6] }
- { source: hydrosphere.soil_moisture, target: bio.vegetation_fraction, mechanism: 水分, sign: positive, equation: eq_33, loops: [] }
- { source: bio.vegetation_fraction, target: bio.npp, mechanism: 光合面积, sign: positive, equation: eq_36, loops: [L6] }
- { source: bio.vegetation_fraction, target: pedo.erosion_rate, mechanism: 固土, sign: negative, equation: eq_44, loops: [L9] }
- { source: atmosphere.temperature, target: bio.fire_probability, mechanism: 干热, sign: positive, equation: eq_37, loops: [L8] }
- { source: bio.biomass, target: bio.fire_probability, mechanism: 可燃物, sign: positive, equation: eq_37, loops: [L8] }
- { source: hydrosphere.soil_moisture, target: bio.fire_probability, mechanism: 湿润抑制, sign: negative, equation: eq_37, loops: [L8] }
- { source: bio.fire_probability, target: bio.biomass, mechanism: 燃烧, sign: negative, equation: eq_38, loops: [L8] }
- { source: bio.fire_probability, target: atmosphere.co2, mechanism: 燃烧排放, sign: positive, equation: eq_38, loops: [L8] }
- { source: bio.fire_probability, target: bio.vegetation_fraction, mechanism: 毁林, sign: negative, equation: eq_34, loops: [L8] }
- { source: downscale.warming_pattern, target: bio.biome_class, mechanism: 气候带迁移, sign: positive, equation: eq_50, loops: [] }
- { source: bio.biome_class, target: surface.land_cover, mechanism: 覆盖更新, sign: positive, equation: eq_50, loops: [] }
# ---- 地貌与侵蚀（L9）----
- { source: geo.elevation, target: geo.slope, mechanism: 梯度, sign: positive, equation: eq_41, loops: [] }
- { source: hydrosphere.runoff, target: pedo.erosion_rate, mechanism: 侵蚀, sign: positive, equation: eq_43, loops: [L9] }
- { source: pedo.erosion_rate, target: geo.elevation, mechanism: 剥蚀, sign: negative, equation: eq_47, loops: [L9] }
- { source: hydrosphere.river_discharge, target: geo.sediment_flux, mechanism: 输沙, sign: positive, equation: eq_46, loops: [L9] }
- { source: pedo.erosion_rate, target: geo.sediment_flux, mechanism: 物源, sign: positive, equation: eq_45, loops: [L9] }
- { source: geo.sediment_flux, target: geo.elevation, mechanism: 沉积, sign: positive, equation: eq_47, loops: [L9] }
- { source: geo.slope, target: pedo.erosion_rate, mechanism: 势能, sign: positive, equation: eq_42, loops: [L9] }
- { source: geo.slope, target: geo.sediment_flux, mechanism: 搬运, sign: positive, equation: eq_46, loops: [L9] }
- { source: pedo.erosion_rate, target: pedo.soil_depth, mechanism: 变薄, sign: negative, equation: eq_47, loops: [] }
# ---- 海岸线（L10）----
- { source: sea.level, target: surface.inundation_mask, mechanism: 淹没, sign: positive, equation: eq_49, loops: [L10] }
- { source: geo.elevation, target: surface.inundation_mask, mechanism: 地势, sign: negative, equation: eq_49, loops: [L10] }
- { source: sea.level, target: geo.coastline_position, mechanism: 侵蚀后退, sign: negative, equation: eq_48, loops: [L10] }
- { source: sea.level, target: geo.landmask, mechanism: 淹没, sign: negative, equation: eq_49, loops: [L10] }
- { source: geo.coastline_position, target: surface.land_cover, mechanism: 覆盖更新, sign: positive, equation: null, loops: [] }
- { source: surface.inundation_mask, target: surface.land_cover, mechanism: 覆盖更新, sign: positive, equation: eq_49, loops: [L10] }
- { source: human.adaptation, target: surface.inundation_mask, mechanism: 防护工程, sign: negative, equation: null, loops: [] }
# ---- 降尺度（v0 城市级）----
- { source: atmosphere.temperature, target: downscale.city_climate, mechanism: 全球信号, sign: positive, equation: eq_51, loops: [] }
- { source: downscale.warming_pattern, target: downscale.city_climate, mechanism: 纬度放大, sign: positive, equation: eq_51, loops: [] }
- { source: hydrosphere.precipitation, target: downscale.city_climate, mechanism: 降水信号, sign: positive, equation: eq_52, loops: [] }
- { source: downscale.city_climate, target: bio.biome_class, mechanism: 群系判定, sign: positive, equation: eq_50, loops: [] }
- { source: atmosphere.temperature, target: hydrosphere.precipitation, mechanism: 水循环加强, sign: positive, equation: eq_52, loops: [L5] }
```

- [ ] **Step 2: 写 datasets.yaml（完整内容；stage a=计划 A 交付，b=计划 B 交付）**

```yaml
- { id: historical.emissions, path: datasets/historical/emissions_1750_2024.csv, provider: "Global Carbon Project (经 OWID 镜像)", url: "https://ourworldindata.org/grapher/annual-co2-emissions-per-country.csv", license: "CC-BY 4.0", stage: a, variables: [human.emissions_fossil], notes: "化石+水泥 MtCO₂→GtC；LULUC 由 GCB 量级锚点合成" }
- { id: historical.co2_concentration, path: datasets/historical/co2_concentration_1850_2024.csv, provider: "NOAA GML + Law Dome 冰芯", url: "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_gl.csv", license: "公有领域", stage: a, variables: [atmosphere.co2], notes: "1959 前 Law Dome/冰芯插值" }
- { id: historical.temperature, path: datasets/historical/temperature_1850_2024.csv, provider: "NASA GISTEMP v4", url: "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv", license: "公有领域", stage: a, variables: [atmosphere.temperature], notes: "换算到 1850-1900 基准" }
- { id: historical.forcing_natural, path: datasets/historical/forcing_natural_1850_2024.csv, provider: "本项目合成（AR6 量级锚点）", url: "local://gen-forcing", license: "自有", stage: a, variables: [atmosphere.forcing_other, atmosphere.ch4, atmosphere.n2o], notes: "列: year,ch4,n2o,f_other——火山+气溶胶+其他 ERF 合并 f_other；CH₄/N₂O 为历史浓度锚点" }
- { id: historical.sea_level, path: datasets/historical/sea_level_1880_2024.csv, provider: "PSMSL + NASA 卫星高度计", url: "https://psmsl.org/products/", license: "免费使用需署名", stage: b, variables: [sea.level], notes: "G3 校准用 AR6 常数，曲线校验属计划 B" }
- { id: scenarios.all, path: "datasets/scenarios/ssp*.json", provider: "本项目合成（Riahi 2017 形状 + Meinshausen 2020 端点）", url: "local://gen-forcing", license: "自有", stage: a, variables: [human.emissions_fossil, atmosphere.ch4, atmosphere.n2o, atmosphere.forcing_other], notes: "锚点表线性内插为年度序列" }
- { id: static.dem, path: datasets/static/dem_0.1deg.png, provider: "NOAA ETOPO 2022", url: "https://www.ncei.noaa.gov/products/etopo-global-relief-model", license: "公有领域", stage: b, variables: [geo.elevation], notes: "16 位高度图" }
- { id: static.warming_pattern, path: datasets/static/warming_pattern_lat.csv, provider: "NASA GISTEMP 分带回归（本项目合成）", url: "local://plan-b", license: "公有领域", stage: b, variables: [downscale.warming_pattern], notes: "36 纬度带" }
- { id: static.cities, path: datasets/static/cities_top2000.csv, provider: GeoNames, url: "https://download.geonames.org/export/dump/", license: "CC-BY 4.0", stage: b, variables: [downscale.city_climate, geo.elevation], notes: "含高程字段" }
- { id: static.baseline_climate, path: datasets/static/baseline_climate.csv, provider: "WorldClim 2.1", url: "https://worldclim.org/", license: "CC-BY-SA 4.0", stage: b, variables: [bio.biome_class], notes: "年均 T/P 基准气候态" }
```

- [ ] **Step 3: 写测试**

`packages/spec/src/causal.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { loadSpec } from "./index.js";

describe("causal graph & datasets", () => {
  const spec = loadSpec();
  const varIds = new Set(spec.variables.map((v) => v.id));
  const eqIds = new Set(spec.equations.map((e) => e.id));

  it("因果边数量在 85~110 之间", () => {
    expect(spec.causal_graph.length).toBeGreaterThanOrEqual(85);
    expect(spec.causal_graph.length).toBeLessThanOrEqual(110);
  });
  it("边端点与方程引用必须可解析", () => {
    for (const e of spec.causal_graph) {
      expect(varIds.has(e.source), e.source).toBe(true);
      expect(varIds.has(e.target), e.target).toBe(true);
      if (e.equation) expect(eqIds.has(e.equation), e.equation).toBe(true);
    }
  });
  it("数据源 id 唯一且 stage 合法", () => {
    const ids = spec.datasets.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(10);
  });
});
```

- [ ] **Step 4: 运行并提交**

Run: `pnpm --filter @future-earth/spec test` — Expected: 全部 passed

```bash
git add packages/spec
git commit -m "feat(spec): 因果图(~100 边, 10 反馈回路) + 数据源目录(10 条, stage a/b)"
```

---

### Task 8: 类型生成 + 一致性测试（规格↔代码绑定的第一半）

**Files:**
- Create: `packages/spec/scripts/gen-types.ts`
- Create: `packages/spec/src/generated/spec-types.ts`（生成产物，提交入库）
- Test: `packages/spec/src/consistency.test.ts`

- [ ] **Step 1: 写生成脚本**

`packages/spec/scripts/gen-types.ts`:
```ts
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSpec } from "../src/index.js";

const spec = loadSpec();
const q = (s: string) => JSON.stringify(s);
const lines: string[] = [
  "// 自动生成：pnpm gen:spec —— 请勿手改",
  `export type VariableId = ${spec.variables.map((v) => q(v.id)).join(" | ")};`,
  `export type EquationId = ${spec.equations.map((e) => q(e.id)).join(" | ")};`,
  `export type ParameterId = ${spec.parameters.map((p) => q(p.id)).join(" | ")};`,
  `export type ScenarioId = ${spec.scenarios.map((s) => q(s.id)).join(" | ")};`,
  `export type ImplTier = "v0" | "v1" | "v2" | "v3";`,
  `export const V0_EQUATIONS: EquationId[] = [${spec.equations.filter((e) => e.impl === "v0").map((e) => q(e.id)).join(", ")}];`,
  `export const V0_EQUATION_COUNT = ${spec.equations.filter((e) => e.impl === "v0").length};`,
];
const out = join(dirname(fileURLToPath(import.meta.url)), "../src/generated/spec-types.ts");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log(`generated: ${out} (v0 equations: ${spec.equations.filter((e) => e.impl === "v0").length})`);
```

- [ ] **Step 2: 运行生成并核对**

Run: `pnpm gen:spec`
Expected: 打印 `v0 equations: 21`（eq_06,07,08,09,11,12,13,14,15,16,17,25,26,27,31,32,49,50,51,52,53）

- [ ] **Step 3: 在 `packages/spec/src/index.ts` 末尾追加重导出（引擎从包根导入生成类型的前提）**

```ts
export * from "./generated/spec-types.js";
```

- [ ] **Step 4: 写一致性测试**

`packages/spec/src/consistency.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { loadSpec } from "./index.js";
import { V0_EQUATIONS, V0_EQUATION_COUNT, type EquationId } from "./generated/spec-types.js";

describe("spec 内部一致性", () => {
  const spec = loadSpec();
  const eqById = new Map(spec.equations.map((e) => [e.id, e]));

  it("生成类型与 YAML 同步（v0 数量一致）", () => {
    const yamlV0 = spec.equations.filter((e) => e.impl === "v0").map((e) => e.id).sort();
    expect([...V0_EQUATIONS].sort()).toEqual(yamlV0);
    expect(V0_EQUATION_COUNT).toBe(yamlV0.length);
  });
  it("方程编号连续覆盖 eq_01..eq_53", () => {
    expect(spec.equations.map((e) => e.id)).toEqual(
      Array.from({ length: 53 }, (_, i) => `eq_${String(i + 1).padStart(2, "0")}` as EquationId),
    );
  });
  it("每个状态变量的 equations 字段引用的方程都存在，反之 v0 方程的 outputs 覆盖了对应变量", () => {
    const eqIds = new Set(spec.equations.map((e) => e.id));
    for (const v of spec.variables)
      for (const eq of v.equations) expect(eqIds.has(eq), `${v.id}→${eq}`).toBe(true);
    for (const eq of spec.equations.filter((e) => e.impl === "v0"))
      for (const out of eq.outputs) {
        const v = spec.variables.find((x) => x.id === out)!;
        expect(v.impl === "v0" || !v.state_variable, `${eq.id} 输出 ${out} 应为 v0 或非状态变量`).toBe(true);
      }
  });
});
```

- [ ] **Step 5: 运行全部测试并提交**

Run: `pnpm --filter @future-earth/spec test` — Expected: 全部 passed

```bash
git add packages/spec
git commit -m "feat(spec): gen:spec 类型生成 + 规格内部一致性测试（v0=21 方程）"
```

---

### Task 9: 数据层——真实历史数据获取脚本 + manifest

**Files:**
- Create: `packages/data/scripts/fetch.mjs`
- Create: `packages/data/src/loaders.ts`
- Create: `packages/data/datasets/manifest.json`（由脚本生成）
- Test: `packages/data/src/loaders.test.ts`

**前置说明**：所有下载用 Node ≥20 内置 fetch；任何 URL 失效时的兜底流程：在浏览器打开 provider 主页（datasets.yaml 中 url 字段）→ 找到同义数据文件 → 手动放到 `packages/data/datasets/historical/` 对应文件名 → 重跑 `node packages/data/scripts/fetch.mjs`（其内置的取值范围断言会重新校验数据合理性）。

- [ ] **Step 1: 写 fetch.mjs（含解析、基线换算、单位换算、校验、manifest 写入）**

`packages/data/scripts/fetch.mjs`:
```js
// 用法：node packages/data/scripts/fetch.mjs
// 产出：datasets/historical/{temperature,co2_concentration,emissions}_*.csv + manifest.json 更新
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HIST = join(ROOT, "datasets", "historical");
mkdirSync(HIST, { recursive: true });

async function getText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "future-earth-engine/0.1 (data fetch)" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const interp = (anchors, y) => {
  const ks = Object.keys(anchors).map(Number).sort((a, b) => a - b);
  if (y <= ks[0]) return anchors[ks[0]];
  if (y >= ks.at(-1)) return anchors[ks.at(-1)];
  for (let i = 0; i < ks.length - 1; i++) {
    if (y >= ks[i] && y <= ks[i + 1]) {
      const t = (y - ks[i]) / (ks[i + 1] - ks[i]);
      return anchors[ks[i]] * (1 - t) + anchors[ks[i + 1]] * t;
    }
  }
  throw new Error("interp");
};

// ---------- 1) GISTEMP 温度 ----------
// CSV 表头含 Year,Jan..Dec,J-D,...；取 Year 与 J-D（年均异常，1951-1980 基准）
const gistemp = await getText("https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv");
const rows = gistemp.split(/\r?\n/).filter((l) => l && !l.startsWith('"'));
const header = rows.findIndex((l) => l.startsWith("Year"));
const cols = rows[header].split(",");
const iYear = cols.indexOf("Year"), iJD = cols.indexOf("J-D");
const tempRaw = rows.slice(header + 1)
  .map((l) => l.split(","))
  .filter((c) => c.length > Math.max(iYear, iJD) && /^\d{4}$/.test(c[iYear]))
  .map((c) => ({ year: +c[iYear], anom: +c[iJD] }))
  .filter((r) => r.year >= 1850 && r.year <= 2024 && Number.isFinite(r.anom));
// 换算到 1850-1900 基准
const base = tempRaw.filter((r) => r.year >= 1850 && r.year <= 1900);
const offset = base.reduce((a, r) => a + r.anom, 0) / base.length;
const temp = tempRaw.map((r) => ({ year: r.year, anomaly: +(r.anom - offset).toFixed(4) }));
if (!(temp.at(-1).anomaly > 1.0 && temp.at(-1).anomaly < 1.8)) throw new Error("GISTEMP 2024 异常值超预期范围: " + temp.at(-1).anomaly);
writeFileSync(join(HIST, "temperature_1850_2024.csv"),
  "year,anomaly\n" + temp.map((r) => `${r.year},${r.anomaly}`).join("\n") + "\n");

// ---------- 2) CO₂（NOAA 1959+ / Law Dome 1832-1978 / 1850 前冰芯常数）----------
const noaa = await getText("https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_gl.csv");
const noaaRows = noaa.split(/\r?\n/).filter((l) => l && !l.startsWith("#"))
  .map((l) => l.split(","))
  .filter((c) => /^\d{4}$/.test(c[0]))
  .map((c) => ({ year: +c[0], ppm: +c[1] }))
  .filter((r) => r.year <= 2024);
let ldRows = [];
try {
  const lawdome = await getText("https://www.ncei.noaa.gov/pub/data/paleo/icecore/antarctica/lawdome/lawdome.co2.txt");
  ldRows = lawdome.split(/\r?\n/)
    .map((l) => l.trim().split(/\s+/))
    .filter((c) => c.length === 2 && /^\d{4}(\.\d+)?$/.test(c[0]))
    .map((c) => ({ year: Math.round(+c[0]), ppm: +c[1] }))
    .filter((r) => r.year >= 1832 && r.year <= 1958);
} catch (e) { console.warn("Law Dome 下载失败，1850-1958 用冰芯锚点插值兜底"); }
const ldAnchors = ldRows.length ? Object.fromEntries(ldRows.map((r) => [r.year, r.ppm])) : { 1832: 284.7, 1850: 285.2, 1900: 295.7, 1950: 311.9, 1958: 314.9 };
const co2 = [];
for (let y = 1850; y <= 2024; y++) {
  const n = noaaRows.find((r) => r.year === y);
  const ppm = n ? n.ppm : interp(ldAnchors, y);
  co2.push({ year: y, ppm: +ppm.toFixed(2) });
}
if (!(co2.at(-1).ppm > 415 && co2.at(-1).ppm < 430)) throw new Error("CO₂ 2024 超预期: " + co2.at(-1).ppm);
writeFileSync(join(HIST, "co2_concentration_1850_2024.csv"),
  "year,ppm\n" + co2.map((r) => `${r.year},${r.ppm}`).join("\n") + "\n");

// ---------- 3) 化石排放（OWID 世界总量；LULUC 用 GCB 量级锚点合成）----------
let emis;
try {
  const owid = await getText("https://ourworldindata.org/grapher/annual-co2-emissions-per-country.csv?format=csv");
  emis = owid.split(/\r?\n/).map((l) => l.split(","))
    .filter((c) => c[0] === "World" && /^\d{4}$/.test(c[2]))
    .map((c) => ({ year: +c[2], gtc: +(parseFloat(c[3]) * 0.001 * 12 / 44).toFixed(3) })); // MtCO₂→GtC
} catch (e) {
  // 兜底锚点（GCB 2024 量级）：形状与官方一致，仅端点校验弱化
  const a = { 1750: 0.003, 1850: 0.09, 1900: 0.55, 1925: 0.9, 1950: 1.6, 1970: 3.6, 1980: 5.2, 1990: 5.9, 2000: 6.5, 2010: 8.3, 2020: 9.5, 2024: 10.1 };
  emis = []; for (let y = 1750; y <= 2024; y++) emis.push({ year: y, gtc: +interp(a, y).toFixed(3) });
}
const lulucA = { 1750: 0.05, 1800: 0.3, 1850: 0.5, 1900: 0.9, 1950: 1.3, 1980: 1.7, 2000: 1.6, 2020: 1.3, 2024: 1.2 };
if (!(emis.at(-1).gtc > 9 && emis.at(-1).gtc < 11.5)) throw new Error("2024 化石排放超预期: " + emis.at(-1).gtc);
writeFileSync(join(HIST, "emissions_1750_2024.csv"),
  "year,efossil,eluluc\n" + emis.map((r) => `${r.year},${r.gtc},${interp(lulucA, r.year).toFixed(3)}`).join("\n") + "\n");

// ---------- 4) manifest ----------
const files = ["temperature_1850_2024.csv", "co2_concentration_1850_2024.csv", "emissions_1750_2024.csv"];
const manifestPath = join(ROOT, "datasets", "manifest.json");
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { version: 1, entries: {} };
for (const f of files) {
  const content = readFileSync(join(HIST, f), "utf8");
  manifest.entries[`historical/${f}`] = {
    sha256: sha256(content), bytes: Buffer.byteLength(content), retrieved: new Date().toISOString().slice(0, 10),
    source: f.startsWith("temperature") ? "NASA GISTEMP v4" : f.startsWith("co2") ? "NOAA GML + Law Dome" : "OWID/GCP + GCB锚点",
  };
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log("OK — 行数: 温度", temp.length, "| CO₂", co2.length, "| 排放", emis.length);
console.log("2024 检查: ΔT=" + temp.at(-1).anomaly + "°C  CO₂=" + co2.at(-1).ppm + "ppm  化石=" + emis.at(-1).gtc + "GtC");
```

- [ ] **Step 2: 运行抓取**

Run: `node packages/data/scripts/fetch.mjs`
Expected: 打印 `OK — 行数: 温度 175 | CO₂ 175 | 排放 275` 及三项 2024 检查值（ΔT ∈ [1.1,1.7]、CO₂ ∈ [415,430]、化石 ∈ [9,11.5] GtC）

- [ ] **Step 3: 写加载器（含 manifest 校验）**

`packages/data/src/loaders.ts`:
```ts
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { z } from "zod";

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DS = join(PKG_ROOT, "datasets");

function readCsv(rel: string): string[][] {
  const lines = readFileSync(join(DS, rel), "utf8").trim().split(/\r?\n/);
  return lines.map((l) => l.split(","));
}
function checkManifest(rel: string) {
  const m = JSON.parse(readFileSync(join(DS, "manifest.json"), "utf8"));
  const e = m.entries[rel];
  if (!e) throw new Error(`manifest 缺少条目: ${rel}`);
  const content = readFileSync(join(DS, rel), "utf8");
  const h = createHash("sha256").update(content).digest("hex");
  if (h !== e.sha256) throw new Error(`校验和不匹配: ${rel}`);
}

const row = (schema: z.ZodTypeAny) => schema;
const TempRow = z.object({ year: z.number().int(), anomaly: z.number() });
const Co2Row = z.object({ year: z.number().int(), ppm: z.number().positive() });
const EmisRow = z.object({ year: z.number().int(), efossil: z.number(), eluluc: z.number() });
const ForcingRow = z.object({ year: z.number().int(), ch4: z.number().positive(), n2o: z.number().positive(), fOther: z.number() });

function parseCsv<T>(rel: string, schema: z.ZodType<T>, map: (c: string[]) => unknown): T[] {
  checkManifest(rel);
  const rows = readCsv(rel).slice(1).map(map);
  return rows.map((r) => schema.parse(r));
}

export const loadTemperature = () => parseCsv("historical/temperature_1850_2024.csv", TempRow, (c) => ({ year: +c[0], anomaly: +c[1] }));
export const loadCO2 = () => parseCsv("historical/co2_concentration_1850_2024.csv", Co2Row, (c) => ({ year: +c[0], ppm: +c[1] }));
export const loadEmissions = () => parseCsv("historical/emissions_1750_2024.csv", EmisRow, (c) => ({ year: +c[0], efossil: +c[1], eluluc: +c[2] }));
export const loadForcing = () => parseCsv("historical/forcing_natural_1850_2024.csv", ForcingRow, (c) => ({ year: +c[0], ch4: +c[1], n2o: +c[2], fOther: +c[3] }));

export interface ScenarioSeries { id: string; name: string; years: number[]; efossil: number[]; eluluc: number[]; ch4: number[]; n2o: number[]; fOther: number[]; landWaterRate: number }
export function loadScenario(id: "ssp126" | "ssp245" | "ssp370" | "ssp585"): ScenarioSeries {
  const p = join(DS, "scenarios", `${id}.json`);
  if (!existsSync(p)) throw new Error(`情景文件不存在: ${id}（先运行 gen-forcing.mjs）`);
  return JSON.parse(readFileSync(p, "utf8")) as ScenarioSeries;
}
```

- [ ] **Step 4: 写测试**

`packages/data/src/loaders.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { loadTemperature, loadCO2, loadEmissions } from "./loaders.js";

describe("数据加载", () => {
  it("温度：1850-2024 无年份缺口", () => {
    const t = loadTemperature();
    expect(t[0]!.year).toBe(1850);
    expect(t.at(-1)!.year).toBe(2024);
    for (let i = 1; i < t.length; i++) expect(t[i]!.year - t[i - 1]!.year).toBe(1);
  });
  it("CO₂：单调上升、2024 在 415-430ppm", () => {
    const c = loadCO2();
    for (let i = 1; i < c.length; i++) expect(c[i]!.ppm).toBeGreaterThan(c[i - 1]!.ppm - 0.5);
    expect(c.at(-1)!.ppm).toBeGreaterThan(415);
    expect(c.at(-1)!.ppm).toBeLessThan(430);
  });
  it("排放：1750-2024 连续且非负", () => {
    const e = loadEmissions();
    expect(e[0]!.year).toBe(1750);
    expect(e).toHaveLength(275);
    for (const r of e) expect(r.efossil).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 5: 运行并提交**

Run: `pnpm --filter @future-earth/data test` — Expected: 3 passed

```bash
git add packages/data
git commit -m "feat(data): 历史数据抓取脚本(GISTEMP/NOAA/LawDome/OWID) + manifest 校验 + 类型化加载器"
```

---

### Task 10: 自然强迫与情景序列生成（forcing_natural.csv + 4 个情景 JSON）

**Files:**
- Create: `packages/data/scripts/gen-forcing.mjs`
- Create: `packages/data/datasets/historical/forcing_natural_1850_2024.csv`
- Create: `packages/data/datasets/scenarios/ssp{126,245,370,585}.json`
- Test: `packages/data/src/forcing.test.ts`

**说明**：`forcing_natural_1850_2024.csv` 的列是 `year,ch4,n2o,f_other`——f_other 为「火山+气溶胶+土地利用+臭氧」合并的其他有效辐射强迫（AR6 Table 7.8 量级锚点合成，含 1883 Krakatoa、1963 Agung、1982 El Chichón、1991 Pinatubo 火山脉冲）；CH₄/N₂O 为历史浓度锚点（冰芯+AGAGE 量级）。

- [ ] **Step 1: 写 gen-forcing.mjs**

`packages/data/scripts/gen-forcing.mjs`:
```js
// 用法：node packages/data/scripts/gen-forcing.mjs
// 从 spec 的 scenarios.yaml 与内置锚点表生成 forcing_natural.csv 和 ssp*.json
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { parse } from "yaml";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "datasets");
const SPEC = join(dirname(fileURLToPath(import.meta.url)), "../../spec/src/spec");
const interp = (anchors, y) => {
  const ks = Object.keys(anchors).map(Number).sort((a, b) => a - b);
  if (y <= ks[0]) return anchors[ks[0]];
  if (y >= ks.at(-1)) return anchors[ks.at(-1)];
  const i = ks.findIndex((k) => k >= y) - 1;
  const t = (y - ks[i]) / (ks[i + 1] - ks[i]);
  return anchors[ks[i]] * (1 - t) + anchors[ks[i + 1]] * t;
};
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ---- 历史 f_other 锚点（火山脉冲 + 气溶胶基线；AR6 量级）----
const fOtherA = {
  1850: -0.15, 1883: -0.15, 1884: -2.30, 1885: -1.00, 1886: -0.30, 1900: -0.20, 1912: -0.45,
  1913: -0.35, 1930: -0.25, 1950: -0.45, 1963: -1.00, 1964: -0.40, 1970: -0.55, 1980: -0.65,
  1982: -1.20, 1983: -0.50, 1985: -0.70, 1990: -0.80, 1991: -0.90, 1992: -2.40, 1993: -1.00,
  1994: -0.60, 2000: -1.05, 2010: -0.95, 2015: -0.85, 2020: -0.80, 2024: -0.75,
};
// ---- 历史 CH₄/N₂O 浓度锚点（ppb；冰芯+现代观测量级）----
const ch4A = { 1850: 800, 1900: 930, 1950: 1160, 1970: 1420, 1990: 1710, 2000: 1770, 2010: 1800, 2020: 1890, 2024: 1930 };
const n2oA = { 1850: 272, 1900: 274, 1950: 289, 1975: 303, 2000: 317, 2010: 324, 2020: 333, 2024: 337 };

const histCsv = ["year,ch4,n2o,f_other", ...range(1850, 2024).map((y) =>
  `${y},${interp(ch4A, y).toFixed(1)},${interp(n2oA, y).toFixed(1)},${interp(fOtherA, y).toFixed(3)}`)].join("\n") + "\n";
writeFileSync(join(DATA, "historical", "forcing_natural_1850_2024.csv"), histCsv);

// ---- 情景 JSON（从 spec scenarios.yaml 展开）----
const scenarios = parse(readFileSync(join(SPEC, "scenarios.yaml"), "utf8"));
mkdirSync(join(DATA, "scenarios"), { recursive: true });
for (const s of scenarios) {
  const years = range(2025, 2500);
  const out = {
    id: s.id, name: s.name,
    years,
    efossil: years.map((y) => +interp(s.co2_emission_anchors_gtc, y).toFixed(3)),
    eluluc: years.map((y) => +interp(s.luluc_anchors_gtc, y).toFixed(3)),
    ch4: years.map((y) => +interp(s.ch4_anchors_ppb, y).toFixed(0)),
    n2o: years.map((y) => +interp(s.n2o_anchors_ppb, y).toFixed(0)),
    fOther: years.map((y) => +interp(s.f_other_anchors_wm2, y).toFixed(3)),
    landWaterRate: s.land_water_rate_m_yr,
  };
  writeFileSync(join(DATA, "scenarios", `${s.id}.json`), JSON.stringify(out) + "\n");
  console.log(`scenario ${s.id}: 2100 化石排放 = ${out.efossil[years.indexOf(2100)]} GtC/yr`);
}

// ---- manifest 追加生成物 ----
const mp = join(DATA, "manifest.json");
const m = JSON.parse(readFileSync(mp, "utf8"));
const files = ["historical/forcing_natural_1850_2024.csv", "scenarios/ssp126.json", "scenarios/ssp245.json", "scenarios/ssp370.json", "scenarios/ssp585.json"];
for (const f of files) {
  const c = readFileSync(join(DATA, f), "utf8");
  m.entries[f] = { sha256: createHash("sha256").update(c).digest("hex"), bytes: Buffer.byteLength(c), retrieved: new Date().toISOString().slice(0, 10), source: "gen-forcing 合成（AR6/Riahi/Meinshausen 锚点）" };
}
writeFileSync(mp, JSON.stringify(m, null, 2) + "\n");
console.log("OK");
```
（`yaml` 依赖需要加进 data 包：`pnpm --filter @future-earth/data add yaml`）

- [ ] **Step 2: 运行生成**

Run: `node packages/data/scripts/gen-forcing.mjs`
Expected: 打印四个情景的 2100 化石排放（约 −2 / 5 / 24 / 33.5 GtC/yr）与 `OK`

- [ ] **Step 3: 写测试**

`packages/data/src/forcing.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { loadForcing, loadScenario } from "./loaders.js";

describe("forcing 与情景", () => {
  it("forcing_natural：1850-2024 连续，Pinatubo 1992 是强负值", () => {
    const f = loadForcing();
    expect(f).toHaveLength(175);
    const pin = f.find((r) => r.year === 1992)!;
    expect(pin.fOther).toBeLessThan(-2.0);
    expect(f.at(-1)!.ch4).toBeGreaterThan(1800);
    expect(f.at(-1)!.n2o).toBeGreaterThan(330);
  });
  it("四情景 2025-2500 完整且首年衔接", () => {
    for (const id of ["ssp126", "ssp245", "ssp370", "ssp585"] as const) {
      const s = loadScenario(id);
      expect(s.years[0]).toBe(2025);
      expect(s.years.at(-1)).toBe(2500);
      expect(s.years).toHaveLength(476);
      expect(s.efossil[0]).toBeGreaterThan(9); // 与 2024 历史排放平滑衔接
    }
  });
});
```

- [ ] **Step 4: 运行并提交**

Run: `pnpm --filter @future-earth/data test` — Expected: 5 passed（含 Task 9 的 3 个）

```bash
git add packages/data pnpm-lock.yaml
git commit -m "feat(data): 其他强迫(含火山脉冲/CH₄/N₂O锚点)与四情景年度序列生成"
```

---

### Task 11: 引擎类型 + 注册表 + 辐射强迫与碳循环方程（eq_06~09, 15~17）

**Files:**
- Create: `packages/engine/src/types.ts`
- Create: `packages/engine/src/registry.ts`
- Create: `packages/engine/src/equations/forcing.ts`
- Create: `packages/engine/src/equations/carbon.ts`
- Test: `packages/engine/src/equations/forcing.test.ts`、`packages/engine/src/equations/carbon.test.ts`

- [ ] **Step 1: 写类型**

`packages/engine/src/types.ts`:
```ts
/** v0 地球状态向量（SPEC §6.3）：温度为相对 1850 的异常（K），海平面各项为自起算年累计上升（m） */
export interface EarthState {
  co2: number;       // ppm
  ts: number;        // 表层温度异常 K（大气+海洋混合层）
  td: number;        // 深海温度异常 K
  sThermal: number;  // 热膨胀海平面 m
  sGlacier: number;  // 冰川消融海平面 m
  sGrIS: number;     // 格陵兰海平面 m
  sAIS: number;      // 南极海平面 m
  sLandWater: number;// 陆地水海平面 m
}
/** 外部驱动（每年插值） */
export interface Drivers {
  year: number; efossil: number; eluluc: number; // GtC/yr
  ch4: number; n2o: number;                      // ppb
  fOther: number;                                // W/m² 其他有效辐射强迫
}
export type Params = Record<string, number>;

export interface YearRecord {
  year: number; co2: number; tempAnomaly: number; oceanDeep: number; forcing: number;
  seaLevel: number; slThermal: number; slGlacier: number; slIceSheet: number; slLandWater: number;
  oceanUptake: number; landSink: number;
}
export interface SimResult {
  schemaVersion: 1; modelVersion: string; scenario: string; paramsFingerprint: string;
  years: number[];
  metrics: {
    tempAnomaly: number[]; co2: number[];
    seaLevel: { total: number[]; thermal: number[]; glacier: number[]; iceSheet: number[]; landWater: number[] };
  };
}
```

- [ ] **Step 2: 写 forcing.ts 与 carbon.ts**

`packages/engine/src/equations/forcing.ts`:
```ts
import type { Params } from "../types.js";

/** eq_07: F_CO2 = 5.35·ln(C/C0) — Myhre 1998 */
export function fCO2(co2: number, p: Params): number {
  return 5.35 * Math.log(co2 / p.c0_ref);
}
export function fCH4(ch4: number, p: Params): number {
  return p.a_ch4 * (Math.sqrt(ch4) - Math.sqrt(p.ch4_ref));
}
export function fN2O(n2o: number, p: Params): number {
  return p.a_n2o * (Math.sqrt(n2o) - Math.sqrt(p.n2o_ref));
}
/** eq_08: 温室气体总强迫 */
export function fGHG(co2: number, ch4: number, n2o: number, p: Params): number {
  return fCO2(co2, p) + fCH4(ch4, p) + fN2O(n2o, p);
}
/** eq_09: 总辐射强迫（含火山/气溶胶等其他 ERF） */
export function fTotal(co2: number, ch4: number, n2o: number, fOther: number, p: Params): number {
  return fGHG(co2, ch4, n2o, p) + fOther;
}
```

`packages/engine/src/equations/carbon.ts`:
```ts
import type { Drivers, Params } from "../types.js";

/** eq_16: 陆地碳汇（CO₂ 施肥）GtC/yr */
export function landSink(co2: number, p: Params): number {
  return p.beta_land * Math.log(co2 / p.c0_ref);
}
/** eq_17: 海洋碳汇（溶解梯度 + 温度抑制）GtC/yr */
export function oceanSink(co2: number, ts: number, p: Params): number {
  return p.k_ocean * (co2 - p.c0_ref) - p.chi_temp * ts;
}
/** eq_15: 大气 CO₂ 变化率 ppm/yr */
export function dCO2ppm(co2: number, ts: number, d: Drivers, p: Params): number {
  return (d.efossil + d.eluluc - landSink(co2, p) - oceanSink(co2, ts, p)) * p.ppm_per_gtc;
}
```

- [ ] **Step 3: 写注册表（规格↔代码绑定的第二半）**

`packages/engine/src/registry.ts`:
```ts
import type { EquationId } from "@future-earth/spec";
import * as forcing from "./equations/forcing.js";
import * as carbon from "./equations/carbon.js";
import * as ocean from "./equations/ocean.js";
import * as sealevel from "./equations/sealevel.js";
import * as downscale from "./equations/downscale.js";

type EqFn = (...args: never[]) => unknown;

/** 方程 id → 可独立调用的纯函数实现（签名各异，一致性测试只校验存在性与可调用性） */
export const REGISTRY: Partial<Record<EquationId, EqFn>> = {
  eq_06: ((F: number, p: { lambda: number }) => F / p.lambda) as EqFn, // 平衡响应诊断 T_eq=F/λ
  eq_07: forcing.fCO2 as EqFn,
  eq_08: forcing.fGHG as EqFn,
  eq_09: forcing.fTotal as EqFn,
  eq_11: ocean.dTs as EqFn,
  eq_12: ocean.dTd as EqFn,
  eq_13: ocean.heatContent as EqFn,
  eq_14: sealevel.dSth as EqFn,
  eq_15: carbon.dCO2ppm as EqFn,
  eq_16: carbon.landSink as EqFn,
  eq_17: carbon.oceanSink as EqFn,
  eq_25: ((ts: number, sG: number, p: Record<string, number>) => -sealevel.dSglacier(ts, sG, p)) as EqFn,
  eq_26: sealevel.dSglacier as EqFn,
  eq_27: sealevel.iceSheetRates as EqFn,
  eq_31: sealevel.seaLevelSum as EqFn,
  eq_32: sealevel.seaLevelRate as EqFn,
  eq_49: downscale.isLandAboveSea as EqFn,
  eq_50: downscale.classifyBiome as EqFn,
  eq_51: downscale.localDTs as EqFn,
  eq_52: downscale.scaledPrecip as EqFn,
  eq_53: downscale.isCityFlooded as EqFn,
};
```

- [ ] **Step 4: 写测试**

`packages/engine/src/equations/forcing.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { fCO2, fGHG, fTotal } from "./forcing.js";

const p = { c0_ref: 280, a_ch4: 0.036, a_n2o: 0.12, ch4_ref: 722, n2o_ref: 273 };

describe("辐射强迫方程", () => {
  it("eq_07: CO₂ 倍增 → 5.35·ln2 ≈ 3.708 W/m²", () => {
    expect(fCO2(560, p)).toBeCloseTo(3.708, 2);
  });
  it("eq_07: 工业前浓度 → 0", () => {
    expect(fCO2(280, p)).toBeCloseTo(0, 6);
  });
  it("eq_08: 2024 现状 GHG 总强迫在 2.8~3.2 W/m²", () => {
    expect(fGHG(422, 1930, 337, p)).toBeGreaterThan(2.8);
    expect(fGHG(422, 1930, 337, p)).toBeLessThan(3.2);
  });
  it("eq_09: 其他强迫为负时总强迫相应降低", () => {
    expect(fTotal(422, 1930, 337, -0.75, p)).toBeCloseTo(fGHG(422, 1930, 337, p) - 0.75, 6);
  });
});
```

`packages/engine/src/equations/carbon.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { landSink, oceanSink, dCO2ppm } from "./carbon.js";

const p = { beta_land: 8.8, k_ocean: 0.02, chi_temp: 0.1, c0_ref: 280, ppm_per_gtc: 0.4708 };
const d = { year: 2024, efossil: 10.1, eluluc: 1.2, ch4: 1930, n2o: 337, fOther: -0.75 };

describe("碳循环方程", () => {
  it("eq_16: 工业前陆地汇为 0；当前约 3~4 GtC/yr", () => {
    expect(landSink(280, p)).toBe(0);
    expect(landSink(422, p)).toBeGreaterThan(3);
    expect(landSink(422, p)).toBeLessThan(4);
  });
  it("eq_17: 当前海洋汇约 2~3.5 GtC/yr，升温抑制吸收", () => {
    expect(oceanSink(422, 0, p)).toBeGreaterThan(2.5);
    expect(oceanSink(422, 1.4, p)).toBeLessThan(oceanSink(422, 0, p));
  });
  it("eq_15: 现状排放下 CO₂ 年增约 2~3 ppm", () => {
    const r = dCO2ppm(422, 1.4, d, p);
    expect(r).toBeGreaterThan(2);
    expect(r).toBeLessThan(3);
  });
});
```

- [ ] **Step 5: 运行并提交**（注意：Step 3 的 registry.ts 此时尚不能创建——它 import 的 ocean/sealevel/downscale 模块要到 Task 12 才存在。把 Step 3 的内容留到 Task 12 Step 4 一起落地；本任务只提交 types/forcing/carbon 及测试）

Run: `pnpm --filter @future-earth/engine test` — Expected: forcing 4 + carbon 3 passed

```bash
git add packages/engine/src/types.ts packages/engine/src/equations/forcing.ts packages/engine/src/equations/carbon.ts packages/engine/src/equations/*.test.ts
git commit -m "feat(engine): 状态/驱动/结果类型 + 辐射强迫(eq_07~09)与碳循环(eq_15~17)方程"
```

---

### Task 12: 海洋、海平面与降尺度方程（eq_06, 11~14, 25~27, 31~32, 49~53）+ 注册表收口

**Files:**
- Create: `packages/engine/src/equations/ocean.ts`、`sealevel.ts`、`downscale.ts`
- Create: `packages/engine/src/registry.ts`（Task 11 已给出完整内容，此时所有依赖就绪）
- Test: `packages/engine/src/equations/ocean.test.ts`、`sealevel.test.ts`、`downscale.test.ts`、`packages/engine/src/registry.test.ts`

- [ ] **Step 1: 写 ocean.ts**

`packages/engine/src/equations/ocean.ts`:
```ts
import type { Params } from "../types.js";

/** eq_11: 表层能量平衡 dTs/dt = (F - λ·Ts - γ·(Ts-Td))/Cs [K/yr] */
export function dTs(F: number, ts: number, td: number, p: Params): number {
  return (F - p.lambda * ts - p.gamma_ocean * (ts - td)) / p.c_s;
}
/** eq_12: 深层能量平衡 dTd/dt = γ·(Ts-Td)/Cd [K/yr] */
export function dTd(ts: number, td: number, p: Params): number {
  return (p.gamma_ocean * (ts - td)) / p.c_d;
}
/** eq_13: 海洋热含量（诊断） */
export function heatContent(ts: number, td: number, p: Params): number {
  return p.c_s * ts + p.c_d * td;
}
```

- [ ] **Step 2: 写 sealevel.ts**

`packages/engine/src/equations/sealevel.ts`:
```ts
import type { EarthState, Params } from "../types.js";

/** eq_14: 热膨胀 dS_th/dt = k_th·γ·(Ts-Td) [m/yr] */
export function dSth(ts: number, td: number, p: Params): number {
  return p.k_thermal * p.gamma_ocean * (ts - td);
}
/** eq_26: 冰川消融 dS_g/dt = k_g·max(A_g·Ts,0)·max(1-S_g/G0,0) [m SLE/yr]，储量耗尽自动封顶 */
export function dSglacier(ts: number, sGlacier: number, p: Params): number {
  const dTg = Math.max(p.amp_glacier * ts, 0);
  return p.k_glacier * dTg * Math.max(1 - sGlacier / p.g0_glacier, 0);
}
/** eq_27a: 格陵兰 dS/dt = b0 + b1·Δ + b2·Δ²（Δ=A_Gr·Ts） */
export function dSgris(ts: number, p: Params): number {
  const d = Math.max(p.amp_gris * ts, 0);
  return p.b0_gris + p.b1_gris * d + p.b2_gris * d * d;
}
/** eq_27b: 南极 dS/dt = c0 + c1·Ts^1.5 */
export function dSais(ts: number, p: Params): number {
  return p.c0_ais + p.c1_ais * Math.pow(Math.max(ts, 0), 1.5);
}
/** eq_27: 冰盖两分量速率 */
export function iceSheetRates(ts: number, p: Params): { gris: number; ais: number } {
  return { gris: dSgris(ts, p), ais: dSais(ts, p) };
}
/** eq_31: 海平面加总 */
export function seaLevelSum(s: EarthState): number {
  return s.sThermal + s.sGlacier + s.sGrIS + s.sAIS + s.sLandWater;
}
/** eq_32: 海平面总变率（诊断） */
export function seaLevelRate(s: EarthState, p: Params): number {
  return dSth(s.ts, s.td, p) + dSglacier(s.ts, s.sGlacier, p) + dSgris(s.ts, p) + dSais(s.ts, p) + p.lw_rate;
}
```

- [ ] **Step 3: 写 downscale.ts**

`packages/engine/src/equations/downscale.ts`:
```ts
/** 纬度带升温放大系数（默认值来自 GISTEMP 分带回归量级；计划 B 用真实数据文件覆盖） */
export interface WarmingPatternBand { latMin: number; latMax: number; amp: number }
export const DEFAULT_WARMING_PATTERN: WarmingPatternBand[] = [
  { latMin: 60, latMax: 90, amp: 2.8 },
  { latMin: 44, latMax: 60, amp: 1.6 },
  { latMin: 24, latMax: 44, amp: 1.0 },
  { latMin: -24, latMax: 24, amp: 0.85 },
  { latMin: -44, latMax: -24, amp: 0.95 },
  { latMin: -60, latMax: -44, amp: 1.05 },
  { latMin: -90, latMax: -60, amp: 1.4 },
];
export function patternAmp(lat: number, pattern: WarmingPatternBand[] = DEFAULT_WARMING_PATTERN): number {
  const b = pattern.find((x) => lat >= x.latMin && lat < x.latMax) ?? pattern.at(-1)!;
  return b.amp;
}
/** eq_51: 温度模式缩放 ΔT(x,t) = ΔT_global(t)·Π(lat) */
export function localDTs(dTglobal: number, lat: number, pattern?: WarmingPatternBand[]): number {
  return dTglobal * patternAmp(lat, pattern);
}
/** eq_52: 降水标量缩放 P = P0·(1+0.02·ΔT_global) */
export function scaledPrecip(p0: number, dTglobal: number): number {
  return p0 * (1 + 0.02 * dTglobal);
}
/** eq_53: 城市淹没判定 */
export function isCityFlooded(elevationM: number, slrM: number): boolean {
  return elevationM <= slrM;
}
/** eq_49: 一般淹没判定（城市点级；全网格版属 v3） */
export function isLandAboveSea(elevationM: number, slrM: number): boolean {
  return elevationM > slrM;
}
/** eq_50: 生物群系判定（年均温 °C + 年降水 mm） */
export function classifyBiome(annualMeanT: number, annualP: number): string {
  if (annualMeanT < -8) return "冰雪";
  if (annualMeanT < 0) return "苔原";
  if (annualMeanT < 6) return "针叶林";
  if (annualP < 250) return "荒漠";
  if (annualMeanT < 13) return annualP > 700 ? "温带森林" : "草原";
  if (annualMeanT < 20) return annualP > 1200 ? "亚热带森林" : "稀树草原";
  return annualP > 1500 ? "热带森林" : "稀树草原";
}
```

- [ ] **Step 4: 写测试**

`packages/engine/src/equations/ocean.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { dTs, dTd, heatContent } from "./ocean.js";
const p = { lambda: 1.16, gamma_ocean: 0.73, c_s: 8.2, c_d: 105 };

describe("两层 EBM", () => {
  it("eq_11: 零异常零强迫 → 零变率；纯强迫 → F/Cs", () => {
    expect(dTs(0, 0, 0, p)).toBe(0);
    expect(dTs(3.71, 0, 0, p)).toBeCloseTo(3.71 / 8.2, 6);
  });
  it("eq_11/eq_06: 深海恒温下平衡温度 = F/λ（ECS=F2x/λ）", () => {
    const F2x = 5.35 * Math.log(2);
    expect(F2x / p.lambda).toBeCloseTo(3.2, 1); // 默认参数 ECS≈3.2°C
  });
  it("eq_12: 深层跟随表层、符号正确", () => {
    expect(dTd(1, 0, p)).toBeCloseTo(0.73 / 105, 6);
    expect(dTd(0, 1, p)).toBeLessThan(0);
  });
  it("eq_13: 热含量加和", () => {
    expect(heatContent(1, 2, p)).toBeCloseTo(8.2 + 210, 6);
  });
});
```

`packages/engine/src/equations/sealevel.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { dSth, dSglacier, dSgris, dSais, seaLevelSum, seaLevelRate } from "./sealevel.js";
const p = {
  lambda: 1.16, gamma_ocean: 0.73, c_s: 8.2, c_d: 105, k_thermal: 0.0045,
  k_glacier: 0.0005, amp_glacier: 1.5, g0_glacier: 0.4,
  b0_gris: 0.0002, b1_gris: 0.001, b2_gris: 0.0002, amp_gris: 2.0,
  c0_ais: 0.0001, c1_ais: 0.0002, lw_rate: 0.0003,
};
const s = { co2: 422, ts: 1.4, td: 0.8, sThermal: 0.1, sGlacier: 0.1, sGrIS: 0.02, sAIS: 0.015, sLandWater: 0.005 };

describe("海平面方程", () => {
  it("eq_14: 表层暖于深层 → 热膨胀为正", () => {
    expect(dSth(1.4, 0.8, p)).toBeGreaterThan(0);
    expect(dSth(0.8, 1.4, p)).toBeLessThan(0);
  });
  it("eq_26: 冰川储量耗尽后速率归零（长期积分不超过 G0）", () => {
    let sg = 0;
    for (let i = 0; i < 10000; i++) sg += dSglacier(4, sg, p);
    expect(sg).toBeLessThanOrEqual(p.g0_glacier + 1e-9);
  });
  it("eq_27: 冰盖损失随温度单调加速", () => {
    expect(dSgris(2, p)).toBeGreaterThan(dSgris(1, p));
    expect(dSais(2, p)).toBeGreaterThan(dSais(1, p));
    expect(dSgris(1, p) + dSais(1, p)).toBeGreaterThan(0);
  });
  it("eq_31/32: 加总一致", () => {
    expect(seaLevelSum(s)).toBeCloseTo(0.24, 6);
    expect(seaLevelRate(s, p)).toBeGreaterThan(0);
  });
});
```

`packages/engine/src/equations/downscale.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { localDTs, scaledPrecip, isCityFlooded, classifyBiome, patternAmp } from "./downscale.js";

describe("降尺度方程", () => {
  it("eq_51: 北极放大、赤道衰减", () => {
    expect(localDTs(2, 80)).toBeCloseTo(5.6, 6);
    expect(localDTs(2, 0)).toBeCloseTo(1.7, 6);
    expect(patternAmp(80)).toBeGreaterThan(patternAmp(0));
  });
  it("eq_52: 降水随全球升温增加 2%/°C", () => {
    expect(scaledPrecip(1000, 2)).toBeCloseTo(1040, 6);
  });
  it("eq_53: 淹没判定边界", () => {
    expect(isCityFlooded(5, 0.6)).toBe(false);
    expect(isCityFlooded(0.5, 0.6)).toBe(true);
    expect(isCityFlooded(0.6, 0.6)).toBe(true); // 等高即淹
  });
  it("eq_50: 群系查表", () => {
    expect(classifyBiome(-25, 100)).toBe("冰雪");
    expect(classifyBiome(-5, 300)).toBe("苔原");
    expect(classifyBiome(3, 600)).toBe("针叶林");
    expect(classifyBiome(10, 800)).toBe("温带森林");
    expect(classifyBiome(28, 100)).toBe("荒漠");
    expect(classifyBiome(27, 2000)).toBe("热带森林");
  });
});
```

`packages/engine/src/registry.test.ts`（一致性测试第二半——SPEC §4.3）:
```ts
import { describe, it, expect } from "vitest";
import { V0_EQUATIONS } from "@future-earth/spec";
import { REGISTRY } from "./registry.js";

describe("规格↔代码一致性（SPEC §4.3）", () => {
  it("所有 impl:v0 方程都已注册实现", () => {
    for (const id of V0_EQUATIONS) expect(REGISTRY[id], id).toBeDefined();
  });
  it("注册表无孤儿（所有注册 id 都在 v0 清单中）", () => {
    for (const id of Object.keys(REGISTRY)) expect(V0_EQUATIONS).toContain(id);
  });
  it("每个注册项可调用", () => {
    for (const [id, fn] of Object.entries(REGISTRY)) expect(typeof fn, id).toBe("function");
  });
});
```

- [ ] **Step 5: 运行并提交**

Run: `pnpm --filter @future-earth/engine test` — Expected: 全部 passed（含 Task 11 的 7 个）

```bash
git add packages/engine
git commit -m "feat(engine): 两层EBM(eq_11~13)+热膨胀/冰川/冰盖(eq_14,25~27)+海平面加总(eq_31,32)+降尺度(eq_49~53)+注册表收口"
```

---

### Task 13: 求解器 + 情景驱动（RK4、NaN 守卫、碳收支诊断）

**Files:**
- Create: `packages/engine/src/solver.ts`
- Create: `packages/engine/src/scenario.ts`
- Test: `packages/engine/src/solver.test.ts`

- [ ] **Step 1: 写 solver.ts**

`packages/engine/src/solver.ts`:
```ts
import * as forcing from "./equations/forcing.js";
import * as carbon from "./equations/carbon.js";
import * as ocean from "./equations/ocean.js";
import * as sealevel from "./equations/sealevel.js";
import type { Drivers, EarthState, Params, YearRecord } from "./types.js";

export interface RunOptions {
  startYear: number; endYear: number;
  initialState: EarthState;
  driversAt: (year: number) => Drivers;
  params: Params;
  substeps?: number; // 每年子步数，默认 2
}
export interface RunOutput {
  records: YearRecord[];
  carbon: { cumEmissions: number; cumAtmos: number; cumLand: number; cumOcean: number; residualRatio: number };
}

const KEYS = ["co2", "ts", "td", "sThermal", "sGlacier", "sGrIS", "sAIS", "sLandWater"] as const;
const axpy = (a: EarthState, h: number, k: EarthState): EarthState => {
  const out = {} as EarthState;
  for (const key of KEYS) out[key] = a[key] + h * k[key];
  return out;
};
const add = (s: EarthState, h: number, k1: EarthState, k2: EarthState, k3: EarthState, k4: EarthState): EarthState => {
  const out = {} as EarthState;
  for (const key of KEYS) out[key] = s[key] + (h / 6) * (k1[key] + 2 * k2[key] + 2 * k3[key] + k4[key]);
  for (const key of KEYS) if (!Number.isFinite(out[key])) throw new Error(`数值发散: t=${h} ${key}=${out[key]}`);
  return out;
};

/** 完整右端项（SPEC §6.1 因果链） */
export function rhs(s: EarthState, d: Drivers, p: Params): EarthState {
  const F = forcing.fTotal(s.co2, d.ch4, d.n2o, d.fOther, p);
  return {
    co2: (d.efossil + d.eluluc - carbon.landSink(s.co2, p) - carbon.oceanSink(s.co2, s.ts, p)) * p.ppm_per_gtc,
    ts: ocean.dTs(F, s.ts, s.td, p),
    td: ocean.dTd(s.ts, s.td, p),
    sThermal: sealevel.dSth(s.ts, s.td, p),
    sGlacier: sealevel.dSglacier(s.ts, s.sGlacier, p),
    sGrIS: sealevel.dSgris(s.ts, p),
    sAIS: sealevel.dSais(s.ts, p),
    sLandWater: p.lw_rate,
  };
}

export function runSim(o: RunOptions): RunOutput {
  const sub = o.substeps ?? 2;
  const h = 1 / sub;
  const p = o.params;
  let s: EarthState = { ...o.initialState };
  const co2Start = s.co2;
  const records: YearRecord[] = [];
  let cumE = 0, cumL = 0, cumO = 0;
  for (let y = o.startYear; y < o.endYear; y++) {
    for (let i = 0; i < sub; i++) {
      const t = y + i * h;
      const k1 = rhs(s, o.driversAt(t), p);
      const mid = axpy(s, h / 2, k1);
      // 碳收支诊断：用中点状态的汇速率累积（质量守恒检查用）
      cumL += h * carbon.landSink(mid.co2, p);
      cumO += h * carbon.oceanSink(mid.co2, mid.ts, p);
      const k2 = rhs(mid, o.driversAt(t + h / 2), p);
      const k3 = rhs(axpy(s, h / 2, k2), o.driversAt(t + h / 2), p);
      const k4 = rhs(axpy(s, h, k3), o.driversAt(t + h), p);
      s = add(s, h, k1, k2, k3, k4);
    }
    const d = o.driversAt(y + 0.5);
    cumE += d.efossil + d.eluluc;
    const F = forcing.fTotal(s.co2, d.ch4, d.n2o, d.fOther, p);
    records.push({
      year: y + 1, co2: s.co2, tempAnomaly: s.ts, oceanDeep: s.td, forcing: F,
      seaLevel: sealevel.seaLevelSum(s), slThermal: s.sThermal, slGlacier: s.sGlacier,
      slIceSheet: s.sGrIS + s.sAIS, slLandWater: s.sLandWater,
      oceanUptake: carbon.oceanSink(s.co2, s.ts, p), landSink: carbon.landSink(s.co2, p),
    });
  }
  const cumAtmos = (s.co2 - co2Start) / p.ppm_per_gtc;
  const residual = Math.abs(cumE - cumAtmos - cumL - cumO);
  return { records, carbon: { cumEmissions: cumE, cumAtmos, cumLand: cumL, cumOcean: cumO, residualRatio: residual / Math.max(cumE, 1e-9) } };
}
```

- [ ] **Step 2: 写 scenario.ts（历史+情景驱动插值）**

`packages/engine/src/scenario.ts`:
```ts
import { loadEmissions, loadForcing, loadScenario } from "@future-earth/data";
import type { Drivers, EarthState } from "./types.js";

function interpSeries(years: number[], vals: number[], y: number): number {
  if (y <= years[0]!) return vals[0]!;
  if (y >= years.at(-1)!) return vals.at(-1)!;
  let i = 0;
  while (years[i + 1]! < y) i++;
  const t = (y - years[i]!) / (years[i + 1]! - years[i]!);
  return vals[i]! * (1 - t) + vals[i + 1]! * t;
}

/** 历史驱动 1850-2024（排放 + CH₄/N₂O/f_other） */
export function makeHistoricalDrivers(): (year: number) => Drivers {
  const e = loadEmissions(), f = loadForcing();
  const ey = e.map((r) => r.year), fy = f.map((r) => r.year);
  return (year) => ({
    year,
    efossil: interpSeries(ey, e.map((r) => r.efossil), year),
    eluluc: interpSeries(ey, e.map((r) => r.eluluc), year),
    ch4: interpSeries(fy, f.map((r) => r.ch4), year),
    n2o: interpSeries(fy, f.map((r) => r.n2o), year),
    fOther: interpSeries(fy, f.map((r) => r.fOther), year),
  });
}

/** 情景驱动 2025-2500；scale 为化石+LULUC 排放的端点校正因子（校准阶段确定） */
export function makeScenarioDrivers(id: "ssp126" | "ssp245" | "ssp370" | "ssp585", scale = 1): (year: number) => Drivers {
  const s = loadScenario(id);
  return (year) => ({
    year,
    efossil: interpSeries(s.years, s.efossil, year) * scale,
    eluluc: interpSeries(s.years, s.eluluc, year) * scale,
    ch4: interpSeries(s.years, s.ch4, year),
    n2o: interpSeries(s.years, s.n2o, year),
    fOther: interpSeries(s.years, s.fOther, year),
  });
}

/** 1850 年初始状态（CO₂ 取冰芯 1850 值；温度/海平面异常归零） */
export function initialState(co2_1850 = 285.2): EarthState {
  return { co2: co2_1850, ts: 0, td: 0, sThermal: 0, sGlacier: 0, sGrIS: 0, sAIS: 0, sLandWater: 0 };
}
```

- [ ] **Step 3: 写测试**

`packages/engine/src/solver.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { runSim, rhs } from "./solver.js";
import { makeHistoricalDrivers, initialState } from "./scenario.js";
import { loadSpec } from "@future-earth/spec";
import type { Params } from "./types.js";

function defaultParams(): Params {
  const p: Params = {};
  for (const x of loadSpec().parameters) p[x.id] = x.default;
  return p;
}

describe("求解器", () => {
  it("历史运行 1850-2024：无发散、记录 174 条（1851..2024）、有限值", () => {
    const out = runSim({ startYear: 1850, endYear: 2024, initialState: initialState(), driversAt: makeHistoricalDrivers(), params: defaultParams() });
    expect(out.records).toHaveLength(174);
    expect(out.records.at(-1)!.year).toBe(2024);
    for (const r of out.records) {
      expect(Number.isFinite(r.co2)).toBe(true);
      expect(Number.isFinite(r.tempAnomaly)).toBe(true);
    }
  });
  it("G5-质量守恒：碳收支残差 < 1%", () => {
    const out = runSim({ startYear: 1850, endYear: 2024, initialState: initialState(), driversAt: makeHistoricalDrivers(), params: defaultParams() });
    expect(out.carbon.residualRatio).toBeLessThan(0.01);
  });
  it("G5-确定性：同参数两次运行结果逐位一致", () => {
    const opts = { startYear: 1850, endYear: 2024, initialState: initialState(), driversAt: makeHistoricalDrivers(), params: defaultParams() };
    const a = runSim(opts), b = runSim(opts);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it("rhs：人为清零排放 → CO₂ 变率为负（汇主导）", () => {
    const p = defaultParams();
    const s = initialState(422);
    const d = { year: 2024, efossil: 0, eluluc: 0, ch4: 1930, n2o: 337, fOther: -0.75 };
    expect(rhs(s, d, p).co2).toBeLessThan(0);
  });
});
```

- [ ] **Step 4: 运行并提交**

Run: `pnpm --filter @future-earth/engine test` — Expected: 全部 passed（默认参数下历史 2024 值不必达标——那是 Task 14 校准的工作）

```bash
git add packages/engine
git commit -m "feat(engine): RK4 求解器(子步+NaN守卫+碳收支诊断) + 历史/情景驱动插值"
```

---

### Task 14: Nelder-Mead + 三阶段校准 + params.json

**Files:**
- Create: `packages/engine/src/calibrate.ts`
- Create: `packages/engine/params.json`（脚本产物，提交入库）
- Test: `packages/engine/src/calibrate.test.ts`

- [ ] **Step 1: 写 calibrate.ts（完整）**

`packages/engine/src/calibrate.ts`:
```ts
/** 用法：pnpm calibrate —— 分阶段确定性校准，产出 params.json（提交入库） */
import { writeFileSync } from "node:fs";
import { loadSpec } from "@future-earth/spec";
import { loadCO2, loadTemperature } from "@future-earth/data";
import { runSim } from "./solver.js";
import { makeHistoricalDrivers, initialState } from "./scenario.js";
import type { Drivers, Params } from "./types.js";

// ---------- 确定性 Nelder-Mead（单位立方体上工作，越界罚函数）----------
export function nelderMead(f: (x: number[]) => number, x0: number[], iters = 300): number[] {
  const n = x0.length;
  const pen = (x: number[]) => x.some((v) => v < 0 || v > 1) ? 1e6 : 0;
  const obj = (x: number[]) => f(x) + pen(x);
  let pts = [x0, ...Array.from({ length: n }, (_, i) => x0.map((v, j) => (j === i ? Math.min(v + 0.1, 0.99) : v)))];
  let vals = pts.map(obj);
  for (let it = 0; it < iters; it++) {
    const order = vals.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    pts = order.map(([, i]) => pts[i]!); vals = order.map(([v]) => v);
    const cen = x0.map((_, j) => pts.slice(0, n).reduce((a, p) => a + p[j]!, 0) / n);
    const refl = cen.map((c, j) => c + 1.0 * (c - pts[n]![j]!));
    const fr = obj(refl);
    if (fr < vals[0]!) {
      const exp = cen.map((c, j) => c + 2.0 * (c - pts[n]![j]!));
      const fe = obj(exp);
      pts[n] = fe < fr ? exp : refl; vals[n] = Math.min(fe, fr);
    } else if (fr < vals[n - 1]!) {
      pts[n] = refl; vals[n] = fr;
    } else {
      const con = cen.map((c, j) => c + 0.5 * (pts[n]![j]! - c));
      const fc = obj(con);
      if (fc < vals[n]!) { pts[n] = con; vals[n] = fc; }
      else for (let i = 1; i <= n; i++) { pts[i] = pts[0]!.map((v, j) => v + 0.5 * (pts[i]![j]! - v)); vals[i] = obj(pts[i]!); }
    }
  }
  return pts[0]!;
}

// ---------- 参数基准 ----------
const spec = loadSpec();
const DEFAULTS: Params = {};
const RANGE: Record<string, { min: number; max: number }> = {};
for (const x of spec.parameters) { DEFAULTS[x.id] = x.default; RANGE[x.id] = { min: x.min, max: x.max }; }
const toUnit = (id: string, v: number) => (v - RANGE[id]!.min) / (RANGE[id]!.max - RANGE[id]!.min);
const fromUnit = (id: string, u: number) => RANGE[id]!.min + u * (RANGE[id]!.max - RANGE[id]!.min);

// ---------- 观测目标 ----------
const tempObs = loadTemperature();
const co2Obs = loadCO2();
const rmse = (xs: number[], ys: number[]) => Math.sqrt(xs.reduce((a, x, i) => a + (x - ys[i]!) ** 2, 0) / xs.length);

function runHistorical(p: Params) {
  return runSim({ startYear: 1850, endYear: 2024, initialState: initialState(), driversAt: makeHistoricalDrivers(), params: p });
}

// ---------- 三阶段（SPEC §7.2）----------
type Stage = { name: string; ids: string[]; objective: (p: Params) => number };
const STAGES: Stage[] = [
  {
    name: "carbon", ids: ["beta_land", "k_ocean", "chi_temp"],
    objective: (p) => {
      const m = runHistorical(p).records;
      const yrs = m.map((r) => r.year);
      const obs = co2Obs.filter((r) => r.year >= 1959);
      const mod = obs.map((r) => m[yrs.indexOf(r.year)]!.co2);
      return rmse(mod, obs.map((r) => r.ppm)) + 0.05 * Math.abs(m.at(-1)!.co2 - obs.at(-1)!.ppm);
    },
  },
  {
    name: "climate", ids: ["lambda", "gamma_ocean", "c_s", "c_d", "a_ch4"],
    objective: (p) => {
      const m = runHistorical(p).records;
      const obs = tempObs.filter((r) => r.year >= 1900);
      const mod = obs.map((r) => m.find((x) => x.year === r.year)!.tempAnomaly);
      return rmse(mod, obs.map((r) => r.anomaly)) + 0.5 * Math.abs(m.at(-1)!.tempAnomaly - tempObs.at(-1)!.anomaly);
    },
  },
  {
    name: "slr", ids: ["k_thermal", "k_glacier", "b0_gris", "b1_gris", "b2_gris", "c0_ais", "c1_ais"],
    objective: (p) => {
      const m = runHistorical(p).records;
      const at = (y: number) => m.find((r) => r.year === y)!.seaLevel;
      return Math.abs(at(2024) - at(1900) - 0.23) + 2 * Math.abs(at(1993) - at(1900) - 0.13);
    },
  },
];

function main() {
  const values: Params = { ...DEFAULTS };
  const log: Array<{ stage: string; ids: string[]; objective: number }> = [];
  for (const st of STAGES) {
    let best: { x: number[]; v: number } | null = null;
    for (const seed of [0.5, 0.35, 0.65]) {
      const x0 = st.ids.map(() => seed); // 常量种子向量（单位立方体），多起点=3 个种子
      const x = nelderMead((u) => st.objective(applyUnits(values, st.ids, u)), x0);
      const v = st.objective(applyUnits(values, st.ids, x));
      if (!best || v < best.v) best = { x, v };
    }
    Object.assign(values, applyUnits(values, st.ids, best!.x));
    log.push({ stage: st.name, ids: st.ids, objective: +best!.v.toFixed(4) });
    console.log(`stage ${st.name}: J=${best!.v.toFixed(4)}`);
  }
  const out = {
    version: 1, generatedAt: new Date().toISOString().slice(0, 10),
    note: "确定性 Nelder-Mead 三阶段校准（carbon→climate→slr）；重跑 pnpm calibrate 应得到相同结果",
    values, ranges: RANGE, stages: log, scenarioScale: {} as Record<string, number>,
  };
  writeFileSync(new URL("../params.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
  const m = runHistorical(values).records.at(-1)!;
  console.log(`校准后 2024: ΔT=${m.tempAnomaly.toFixed(2)}°C  CO₂=${m.co2.toFixed(1)}ppm  SLR=${m.seaLevel.toFixed(3)}m（自1850）`);
}
function applyUnits(base: Params, ids: string[], u: number[]): Params {
  const p = { ...base };
  ids.forEach((id, i) => (p[id] = fromUnit(id, u[i]!)));
  return p;
}
if (process.argv[1]!.endsWith("calibrate.ts")) main();
```

- [ ] **Step 2: 运行校准**

Run: `pnpm calibrate`
Expected: 三个 stage 的 J 值递次打印，最后一行显示校准后 2024 指标（ΔT 应已接近观测的 ~1.4°C；若仍偏 > 0.3°C，检查 f_other 锚点/CH₄ 系数并微调 a_ch4 范围后重跑）

- [ ] **Step 3: 写测试（校准产物锁定）**

`packages/engine/src/calibrate.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { runSim } from "./solver.js";
import { makeHistoricalDrivers, initialState } from "./scenario.js";
import { loadSpec } from "@future-earth/spec";
import type { Params } from "./types.js";

const paramsFile = JSON.parse(readFileSync(new URL("../params.json", import.meta.url), "utf8"));
const p: Params = paramsFile.values;

function fillDefaults(base: Params): Params {
  const full: Params = { ...base };
  for (const x of loadSpec().parameters) if (!(x.id in full)) full[x.id] = x.default;
  return full;
}
export const calibratedHistorical = () =>
  runSim({ startYear: 1850, endYear: 2024, initialState: initialState(), driversAt: makeHistoricalDrivers(), params: fillDefaults(p) });

describe("校准产物", () => {
  it("params.json 存在、包含三阶段记录且参数在先验范围内", () => {
    expect(paramsFile.stages.map((s: { stage: string }) => s.stage)).toEqual(["carbon", "climate", "slr"]);
    for (const [id, v] of Object.entries(p)) {
      const def = loadSpec().parameters.find((x) => x.id === id)!;
      expect(v, id).toBeGreaterThanOrEqual(def.min);
      expect(v, id).toBeLessThanOrEqual(def.max);
    }
  });
});
```

- [ ] **Step 4: 运行并提交**

Run: `pnpm --filter @future-earth/engine test` — Expected: 全部 passed

```bash
git add packages/engine/params.json packages/engine/src/calibrate.ts packages/engine/src/calibrate.test.ts
git commit -m "feat(engine): 确定性 Nelder-Mead 三阶段校准（碳循环→气候→海平面）+ 锁定 params.json"
```

---

### Task 15: 黄金验收测试 G1–G5 + 情景端点校正

**Files:**
- Create: `packages/engine/src/golden.test.ts`
- Modify: `packages/engine/params.json`（追加 scenarioScale）

- [ ] **Step 1: 写 golden.test.ts（SPEC §7.3 五道门）**

`packages/engine/src/golden.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { runSim } from "./solver.js";
import { makeHistoricalDrivers, makeScenarioDrivers, initialState } from "./scenario.js";
import { loadSpec } from "@future-earth/spec";
import { loadCO2, loadTemperature } from "@future-earth/data";
import type { Params } from "./types.js";

const paramsFile = JSON.parse(readFileSync(new URL("../params.json", import.meta.url), "utf8"));
const base: Params = { ...paramsFile.values };
for (const x of loadSpec().parameters) if (!(x.id in base)) base[x.id] = x.default;
const scale: Record<string, number> = paramsFile.scenarioScale ?? {};
const tempObs = loadTemperature();
const co2Obs = loadCO2();
const hist = runSim({ startYear: 1850, endYear: 2024, initialState: initialState(), driversAt: makeHistoricalDrivers(), params: base });
const H = hist.records;
const at = (y: number) => H.find((r) => r.year === y)!;

/** 历史(1850-2024) + 情景(2025-2500) 串联运行 */
function runScenario(id: "ssp126" | "ssp245" | "ssp370" | "ssp585") {
  const driversHist = makeHistoricalDrivers();
  const driversScn = makeScenarioDrivers(id, scale[id] ?? 1);
  const driversAt = (y: number) => (y <= 2024 ? driversHist(y) : driversScn(y));
  return runSim({ startYear: 1850, endYear: 2500, initialState: initialState(), driversAt, params: base }).records;
}

describe("黄金验收（SPEC §7.3）", () => {
  it("G1 历史温度：|ΔT(2024)−观测| < 0.2°C 且 1980-2024 RMSE < 0.2°C", () => {
    expect(Math.abs(at(2024).tempAnomaly - tempObs.at(-1)!.anomaly)).toBeLessThan(0.2);
    const obs = tempObs.filter((r) => r.year >= 1980);
    const mod = obs.map((r) => at(r.year).tempAnomaly);
    const rmse = Math.sqrt(obs.reduce((a, r, i) => a + (mod[i]! - r.anomaly) ** 2, 0) / obs.length);
    expect(rmse).toBeLessThan(0.2);
  });
  it("G2 历史CO₂：|C(2024)−观测| < 5ppm 且 1960-2024 累计增长误差 < 10%", () => {
    const obs24 = co2Obs.at(-1)!.ppm;
    expect(Math.abs(at(2024).co2 - obs24)).toBeLessThan(5);
    const o60 = co2Obs.find((r) => r.year === 1960)!.ppm;
    const m60 = at(1960).co2;
    const err = Math.abs((at(2024).co2 - m60) - (obs24 - o60)) / (obs24 - o60);
    expect(err).toBeLessThan(0.10);
  });
  it("G3 历史海平面：|S(2024)−S(1900)−0.23m| < 0.07m", () => {
    expect(Math.abs(at(2024).seaLevel - at(1900).seaLevel - 0.23)).toBeLessThan(0.07);
  });
  it("G4 未来情景：2100 年 ΔT 落在 AR6 很可能区间", () => {
    const AR6: Record<string, [number, number, number]> = { // [min, max, best]
      ssp126: [1.3, 2.4, 1.8], ssp245: [2.1, 3.5, 2.7], ssp370: [2.8, 4.6, 3.6], ssp585: [3.3, 5.7, 4.4],
    };
    for (const [id, [lo, hi, best]] of Object.entries(AR6)) {
      const r = runScenario(id as "ssp245").find((x) => x.year === 2100)!;
      console.log(`G4 ${id}: ΔT2100=${r.tempAnomaly.toFixed(2)} (AR6 ${lo}-${hi}, best ${best})`);
      expect(r.tempAnomaly, id).toBeGreaterThan(lo);
      expect(r.tempAnomaly, id).toBeLessThan(hi);
    }
  });
  it("G5 物理健全性：碳守恒残差 < 1%、无 NaN、逐位确定", () => {
    expect(hist.carbon.residualRatio).toBeLessThan(0.01);
    const again = runSim({ startYear: 1850, endYear: 2024, initialState: initialState(), driversAt: makeHistoricalDrivers(), params: base });
    expect(JSON.stringify(again.records)).toBe(JSON.stringify(hist.records));
  });
});
```

- [ ] **Step 2: 运行黄金测试**

Run: `pnpm --filter @future-earth/engine test -- golden`
Expected: G1~G3、G5 passed；**G4 可能 FAIL**——若某情景 2100 浓度偏离 Meinshausen 目标太多，执行 Step 3 端点校正；若 G1~G3 失败，回到 Task 14 调整目标权重/先验并重新校准（这是设计内回路，不是事故）

- [ ] **Step 3: 情景端点校正（一次性，结果写入 params.json）**

创建 `packages/engine/scripts/tune-scenarios.ts`:
```ts
/** 二分法求每情景排放 scale，使模型 C(2100) 命中 Meinshausen 2020 目标 ±2ppm */
import { readFileSync, writeFileSync } from "node:fs";
import { runSim } from "../src/solver.js";
import { makeHistoricalDrivers, makeScenarioDrivers, initialState } from "../src/scenario.js";
import { loadSpec } from "@future-earth/spec";
import type { Params } from "../src/types.js";

const pf = JSON.parse(readFileSync(new URL("../params.json", import.meta.url), "utf8"));
const base: Params = { ...pf.values };
for (const x of loadSpec().parameters) if (!(x.id in base)) base[x.id] = x.default;
const targets: Record<string, number> = {};
for (const s of loadSpec().scenarios) targets[s.id] = s.target_co2_2100_ppm;

const c2100 = (id: string, scale: number) => {
  const dh = makeHistoricalDrivers(), ds = makeScenarioDrivers(id as "ssp245", scale);
  return runSim({ startYear: 1850, endYear: 2100, initialState: initialState(),
    driversAt: (y) => (y <= 2024 ? dh(y) : ds(y)), params: base }).records.at(-1)!.co2;
};
const out: Record<string, number> = {};
for (const [id, target] of Object.entries(targets)) {
  let lo = 0.2, hi = 3.0;
  for (let i = 0; i < 25; i++) {
    const mid = (lo + hi) / 2;
    if (c2100(id, mid) < target) lo = mid; else hi = mid;
  }
  out[id] = +(lo + hi) / 2;
  console.log(`${id}: scale=${out[id]!.toFixed(3)} → C2100=${c2100(id, out[id]!).toFixed(1)} (target ${target})`);
}
pf.scenarioScale = out;
writeFileSync(new URL("../params.json", import.meta.url), JSON.stringify(pf, null, 2) + "\n");
```
Run: `npx tsx packages/engine/scripts/tune-scenarios.ts` → 重跑 golden 测试至 G4 passed → 提交

```bash
git add packages/engine
git commit -m "feat(engine): G1-G5 黄金验收测试 + 情景端点校正（scale 因子锁定 params.json）"
```

---

### Task 16: 对外 API（index.ts）+ CLI + 全仓验证

**Files:**
- Create: `packages/engine/src/index.ts`
- Create: `packages/engine/src/cli.ts`

- [ ] **Step 1: 写 index.ts（SimResult 组装，SPEC §5.5 契约）**

`packages/engine/src/index.ts`:
```ts
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { runSim } from "./solver.js";
import { makeHistoricalDrivers, makeScenarioDrivers, initialState } from "./scenario.js";
import { loadSpec, type ScenarioId } from "@future-earth/spec";
import type { Params, SimResult } from "./types.js";

const MODEL_VERSION = "0.1.0";
const paramsFile = JSON.parse(readFileSync(new URL("../params.json", import.meta.url), "utf8"));

function baseParams(): Params {
  const p: Params = { ...paramsFile.values };
  for (const x of loadSpec().parameters) if (!(x.id in p)) p[x.id] = x.default;
  return p;
}

/** 运行一个情景：历史 1850-2024 串联情景 2025-horizon，输出版本化 SimResult */
export function runScenario(id: ScenarioId, horizon = 2500): SimResult {
  const p = baseParams();
  const dh = makeHistoricalDrivers();
  const ds = makeScenarioDrivers(id, paramsFile.scenarioScale?.[id] ?? 1);
  const recs = runSim({
    startYear: 1850, endYear: horizon, initialState: initialState(),
    driversAt: (y) => (y <= 2024 ? dh(y) : ds(y)), params: p,
  }).records;
  return {
    schemaVersion: 1, modelVersion: MODEL_VERSION, scenario: id,
    paramsFingerprint: "sha256:" + createHash("sha256").update(JSON.stringify(paramsFile.values)).digest("hex").slice(0, 16),
    years: recs.map((r) => r.year),
    metrics: {
      tempAnomaly: recs.map((r) => +r.tempAnomaly.toFixed(3)),
      co2: recs.map((r) => +r.co2.toFixed(2)),
      seaLevel: {
        total: recs.map((r) => +r.seaLevel.toFixed(4)),
        thermal: recs.map((r) => +r.slThermal.toFixed(4)),
        glacier: recs.map((r) => +r.slGlacier.toFixed(4)),
        iceSheet: recs.map((r) => +r.slIceSheet.toFixed(4)),
        landWater: recs.map((r) => +r.slLandWater.toFixed(4)),
      },
    },
  };
}
```
（注：不要从 index.ts 导出任何 *.test.js 中的符号——golden.test.ts 自行重跑模拟，不依赖 calibrate.test.ts。）

- [ ] **Step 2: 写 cli.ts**

`packages/engine/src/cli.ts`:
```ts
/** 用法：npx tsx packages/engine/src/cli.ts --scenario ssp245 --horizon 2500 */
import { runScenario } from "./index.js";
import type { ScenarioId } from "@future-earth/spec";

const args = process.argv.slice(2);
const get = (k: string, d: string) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1]! : d; };
const id = get("scenario", "ssp245") as ScenarioId;
const horizon = Math.min(Number(get("horizon", "2500")), 2500);
const allowed: ScenarioId[] = ["ssp126", "ssp245", "ssp370", "ssp585"];
if (!allowed.includes(id)) { console.error(`未知情景 ${id}；可选: ${allowed.join(", ")}`); process.exit(1); }

const r = runScenario(id, horizon);
console.log(`\n未来地球引擎 v0 — ${id} (至 ${horizon})\n`);
console.log("年份    ΔT(°C)   CO₂(ppm)   海平面(m)   [热膨/冰川/冰盖/陆水]");
for (const y of [2030, 2050, 2100, 2200, 2500].filter((y) => y <= horizon)) {
  const i = r.years.indexOf(y);
  if (i < 0) continue;
  const m = r.metrics;
  console.log(
    `${y}   ${m.tempAnomaly[i]!.toFixed(2).padStart(6)}   ${m.co2[i]!.toFixed(0).padStart(8)}   ${m.seaLevel.total[i]!.toFixed(2).padStart(8)}   [${m.seaLevel.thermal[i]!.toFixed(2)}/${m.seaLevel.glacier[i]!.toFixed(2)}/${m.seaLevel.iceSheet[i]!.toFixed(2)}/${m.seaLevel.landWater[i]!.toFixed(2)}]`,
  );
}
```

- [ ] **Step 3: CLI 冒烟**

Run: `npx tsx packages/engine/src/cli.ts --scenario ssp245`
Expected: 打印 2030/2050/2100/2200/2500 五行里程碑表；2100 行 ΔT 约 2.1~3.5°C、海平面 < 1m 量级

- [ ] **Step 4: 全仓验证**

Run: `pnpm install && pnpm gen:spec && pnpm typecheck && pnpm test`
Expected: gen:spec 打印 `v0 equations: 21`；typecheck 三包全过；测试全绿（spec 8 个文件 + data 2 个 + engine 7 个测试文件）

- [ ] **Step 5: 提交**

```bash
git add packages/engine
git commit -m "feat(engine): runScenario 对外 API(SimResult 契约) + CLI 里程碑表"
```

---

## 完成判据（计划 A Definition of Done）

1. `pnpm test` 全绿，其中 golden.test.ts 的 G1~G5 全部通过（SPEC §7.3 数值门）
2. `pnpm calibrate` 可复现 params.json（确定性）
3. CLI 四情景均可运行并打印合理里程碑值
4. 规格↔代码一致性测试（registry 无孤儿、v0=21 方程全部注册）通过
5. 全部提交进 git，工作区干净

## 计划 A 完成后的下一步

1. 用真实运行结果回填 SPEC 中的「软目标」达成情况（G4 与 AR6 最佳估计的偏差记录进 docs）
2. 编写**计划 B**：apps/web（3D 地球 + 时间轴 + 城市面板 + /api/simulate + CI + Vercel 部署 + 静态空间数据获取）


---

## 执行偏差记录（2026-10-11 执行完成时追加）

执行中相对本计划的实质性偏差（均有测试与文献依据，详见 git log）：

1. **变量数 57→58**：`atmosphere.radiative_forcing`（F_total，系统核心变量）被 15 处引用但计划中未定义，由引用可解析测试捕获后补上
2. **GISTEMP 实际始于 1880**：温度文件更名 `temperature_1880_2024.csv`，测试与 datasets.yaml 同步
3. **OWID 排放单位为吨**：fetch.mjs 增加量纲自适应换算（t/kt/Mt → GtC）
4. **Params 类型收紧**：`Record<string, number>` → `Record<ParameterId, number>`（规格生成类型，配合 noUncheckedIndexedAccess）
5. **未来时段改浓度驱动**（替代 scenarioScale 端点校正）：scale 因子在跨零排放路径（ssp126 净负排放）上非单调，无法收敛；浓度驱动是 IPCC 仿真器标准做法
6. **气候校准加 TCR+ECS 双约束**：仅拟合历史会得到 ECS 4.5°C/TCR 2.7 的组合，G4 过热
7. **GrIS 先验下调**（b1 0.001→0.0003, b2 0.0002→0.00008）：原先验意味着当前格陵兰贡献 3.3mm/yr，实际 ~0.8mm/yr
8. **历史 f_other 补卤代烃/臭氧净贡献**（2024: −0.75→−0.50 W/m²）：AR6 卤代烃 +0.41 原本缺失，导致 G1 系统性偏冷

**最终验收**：G1–G5 全通过（G4: ssp126/245/370/585 = 1.77/2.81/3.98/5.05°C，AR6 最佳估计 1.8/2.7/3.6/4.4）。
