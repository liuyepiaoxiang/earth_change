/** 不确定性量化（v1，SPEC §10）：种子化确定性蒙特卡洛。
 *  这是引擎「禁止随机数」规则的 v1 例外——使用种子化 PRNG，同 seed 结果逐位可复现，
 *  确定性核心（runSim 路径）不受影响，G5 仍由 golden.test 把守。 */
import { runSim } from "./solver.js";
import { makeHistoricalDrivers, makeScenarioDrivers, initialState } from "./scenario.js";
import { CALIBRATED_PARAMS } from "./generated/params.gen.js";
import { PARAMETER_DEFAULTS, PARAMETERS, type ScenarioId } from "@future-earth/spec";
import type { Params } from "./types.js";

export interface McBand {
  p10: number[];
  p50: number[];
  p90: number[];
}
export interface McResult {
  seed: number;
  n: number;
  years: number[];
  tempAnomaly: McBand;
  co2: McBand;
  seaLevel: McBand;
}

/** 扰动参数集：气候敏感度/海洋热交换/碳汇/冰冻圈敏感度等主要不确定源（先验范围见 parameters.yaml） */
export const PERTURBED_IDS = ["lambda", "gamma_ocean", "beta_land", "k_ocean", "amp_glacier", "b2_gris", "c1_ais"] as const;

/** mulberry32：确定性 32 位 PRNG */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 在校准值 ± 35% 先验跨度内均匀采样，钳制在文献先验 [min, max]（含量纲参数不在无意义区间取值） */
export function sampleParamOverrides(rng: () => number, base: Params): Partial<Params> {
  const ranges = new Map(PARAMETERS.map((p) => [p.id, p]));
  const out: Partial<Params> = {};
  for (const pid of PERTURBED_IDS) {
    const r = ranges.get(pid);
    if (!r || r.max === r.min) continue;
    const span = r.max - r.min;
    const v = base[pid] + (rng() * 2 - 1) * span * 0.35;
    out[pid] = Math.min(r.max, Math.max(r.min, v));
  }
  return out;
}

function percentile(sorted: number[], p: number): number {
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo);
}

function band(series: number[][], digits: number): McBand {
  const nYears = series[0]!.length;
  const pick = (p: number) =>
    Array.from({ length: nYears }, (_, j) => +percentile(series.map((s) => s[j]!).sort((a, b) => a - b), p).toFixed(digits));
  return { p10: pick(0.1), p50: pick(0.5), p90: pick(0.9) };
}

/** 运行 n 条扰动模拟，返回温度/CO₂/海平面的 p10/p50/p90 区间（按年分位） */
export function runScenarioMc(id: ScenarioId, horizon = 2500, opts: { n?: number; seed?: number } = {}): McResult {
  const n = Math.max(2, Math.min(400, Math.round(opts.n ?? 100)));
  const seed = opts.seed ?? 20261011;
  const rng = makeRng(seed);
  const base: Params = { ...PARAMETER_DEFAULTS, ...CALIBRATED_PARAMS };
  const dh = makeHistoricalDrivers();
  const ds = makeScenarioDrivers(id);

  const temp: number[][] = [];
  const co2: number[][] = [];
  const sl: number[][] = [];
  let years: number[] = [];

  for (let i = 0; i < n; i++) {
    const p: Record<string, number> = { ...base, ...sampleParamOverrides(rng, base) };
    const recs = runSim({
      startYear: 1850,
      endYear: horizon,
      initialState: initialState(),
      driversAt: (y) => (y <= 2024 ? dh(y) : ds(y)),
      params: p as Params,
    }).records;
    years = recs.map((r) => r.year);
    temp.push(recs.map((r) => +r.tempAnomaly.toFixed(3)));
    co2.push(recs.map((r) => +r.co2.toFixed(2)));
    sl.push(recs.map((r) => +r.seaLevel.toFixed(4)));
  }

  return { seed, n, years, tempAnomaly: band(temp, 3), co2: band(co2, 2), seaLevel: band(sl, 4) };
}
