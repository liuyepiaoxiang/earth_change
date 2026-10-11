/** 用法：pnpm calibrate —— 分阶段确定性校准，产出 params.json（提交入库） */
import { writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { PARAMETER_DEFAULTS, PARAMETERS } from "@future-earth/spec";
import { loadCO2, loadTemperature } from "@future-earth/data";
import { runSim } from "./solver.js";
import { makeHistoricalDrivers, initialState } from "./scenario.js";
import type { Params } from "./types.js";

// ---------- 确定性 Nelder-Mead（单位立方体上工作，越界罚函数）----------
export function nelderMead(f: (x: number[]) => number, x0: number[], iters = 300): number[] {
  const n = x0.length;
  const pen = (x: number[]) => (x.some((v) => v < 0 || v > 1) ? 1e6 : 0);
  const obj = (x: number[]) => f(x) + pen(x);
  let pts: number[][] = [x0, ...Array.from({ length: n }, (_, i) => x0.map((v, j) => (j === i ? Math.min(v + 0.1, 0.99) : v)))];
  let vals = pts.map(obj);
  for (let it = 0; it < iters; it++) {
    const order = vals.map((v, i): [number, number] => [v, i]).sort((a, b) => a[0] - b[0]);
    pts = order.map(([, i]) => pts[i]!); vals = order.map(([v]) => v);
    const cen = pts[0]!.map((_, j) => pts.slice(0, n).reduce((a, p) => a + p[j]!, 0) / n);
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
const DEFAULTS: Record<string, number> = { ...PARAMETER_DEFAULTS };
const RANGE: Record<string, { min: number; max: number }> = {};
for (const x of PARAMETERS) RANGE[x.id] = { min: x.min, max: x.max };
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
      const obs = co2Obs.filter((r) => r.year >= 1959);
      const mod = obs.map((r) => m.find((x) => x.year === r.year)!.co2);
      const at = (arr: { year: number; ppm: number }[], y: number) => arr.find((r) => r.year === y)!.ppm;
      const mat = (y: number) => m.find((r) => r.year === y)!.co2;
      // G2 判据编码：端点偏差（主权重） + 1960-2024 增长率偏差 + 曲线 RMSE
      const endpoint = Math.abs(mat(2024) - at(obs, 2024));
      const growth = Math.abs((mat(2024) - mat(1960)) - (at(obs, 2024) - at(obs, 1960)));
      return rmse(mod, obs.map((r) => r.ppm)) + 1.0 * endpoint + 0.5 * growth;
    },
  },
  {
    name: "climate", ids: ["lambda", "gamma_ocean", "c_s", "c_d", "a_ch4"],
    objective: (p) => {
      const m = runHistorical(p).records;
      const obs = tempObs.filter((r) => r.year >= 1900);
      const mod = obs.map((r) => m.find((x) => x.year === r.year)!.tempAnomaly);
      // 瞬态/平衡双重约束（两层 EBM: TCR≈F2x/(λ+γ), ECS=F2x/λ；AR6: TCR~1.9, ECS~3.1）
      const F2x = 5.35 * Math.log(2);
      const tcr = F2x / (p.lambda + p.gamma_ocean);
      const ecs = F2x / p.lambda;
      return rmse(mod, obs.map((r) => r.anomaly)) + 0.5 * Math.abs(m.at(-1)!.tempAnomaly - tempObs.at(-1)!.anomaly)
        + 2.0 * Math.abs(tcr - 1.9) + 2.0 * Math.abs(ecs - 3.1);
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

function applyUnits(base: Record<string, number>, ids: string[], u: number[]): Record<string, number> {
  const p = { ...base };
  ids.forEach((id, i) => (p[id] = fromUnit(id, u[i]!)));
  return p;
}

function main() {
  const values: Record<string, number> = { ...DEFAULTS };
  const log: Array<{ stage: string; ids: string[]; objective: number }> = [];
  for (const st of STAGES) {
    let best: { x: number[]; v: number } | null = null;
    for (const seed of [0.5, 0.35, 0.65]) {
      const x0 = st.ids.map(() => seed); // 常量种子向量（单位立方体），多起点=3 个种子
      const x = nelderMead((u) => st.objective(applyUnits(values, st.ids, u) as Params), x0);
      const v = st.objective(applyUnits(values, st.ids, x) as Params);
      if (!best || v < best.v) best = { x, v };
    }
    Object.assign(values, applyUnits(values, st.ids, best!.x));
    log.push({ stage: st.name, ids: st.ids, objective: +best!.v.toFixed(4) });
    console.log(`stage ${st.name}: J=${best!.v.toFixed(4)}`);
  }
  const out = {
    version: 1, generatedAt: new Date().toISOString().slice(0, 10),
    note: "确定性 Nelder-Mead 三阶段校准（carbon→climate→slr）；重跑 pnpm calibrate 应得到相同结果",
    values, ranges: RANGE, stages: log,
  };
  writeFileSync(new URL("../params.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
  mkdirSync(new URL("./generated/", import.meta.url), { recursive: true });
  // 指纹在校准期预计算（node:crypto 不可进浏览器 bundle，index.ts 须保持纯 TS）
  const fingerprint = "sha256:" + createHash("sha256").update(JSON.stringify(values)).digest("hex").slice(0, 16);
  writeFileSync(new URL("./generated/params.gen.ts", import.meta.url),
    "// 自动生成：pnpm calibrate —— 请勿手改\nexport const CALIBRATED_PARAMS = " + JSON.stringify(values) + " as const;\n"
    + "export const PARAMS_FINGERPRINT = " + JSON.stringify(fingerprint) + ";\n", "utf8");
  const m = runHistorical(values as Params).records.at(-1)!;
  console.log(`校准后 2024: ΔT=${m.tempAnomaly.toFixed(2)}°C  CO₂=${m.co2.toFixed(1)}ppm  SLR=${m.seaLevel.toFixed(3)}m（自1850）`);
}
if (process.argv[1]!.endsWith("calibrate.ts")) main();
