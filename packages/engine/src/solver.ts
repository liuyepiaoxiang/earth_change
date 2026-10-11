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
const step = (s: EarthState, h: number, k1: EarthState, k2: EarthState, k3: EarthState, k4: EarthState, tLabel: number): EarthState => {
  const out = {} as EarthState;
  for (const key of KEYS) out[key] = s[key] + (h / 6) * (k1[key] + 2 * k2[key] + 2 * k3[key] + k4[key]);
  for (const key of KEYS) if (!Number.isFinite(out[key])) throw new Error(`数值发散: t=${tLabel} ${key}=${out[key]}`);
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
      s = step(s, h, k1, k2, k3, k4, t);
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
