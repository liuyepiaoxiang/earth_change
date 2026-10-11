import * as forcing from "./equations/forcing.js";
import * as carbon from "./equations/carbon.js";
import * as ocean from "./equations/ocean.js";
import * as sealevel from "./equations/sealevel.js";
import * as water from "./equations/water.js";
import * as bio from "./equations/bio.js";
import { fTemp as bioFTemp, fPrecip as bioFPrecip, fWater as bioFWater, fCo2 as bioFCo2 } from "./equations/bio.js";
import * as fire from "./equations/fire.js";
import * as permafrost from "./equations/permafrost.js";
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
  carbon: {
    cumEmissions: number; cumFeedback: number; cumAtmos: number; cumLand: number; cumOcean: number;
    /** 守恒残差比——仅对排放驱动段闭合（G5/G6 断言范围）；浓度驱动段（钉住+反馈抬升）
     *  的反馈碳被自然汇部分吸收，闭合需完整碳循环，单独报告 cumFeedback 净额 */
    residualRatio: number;
  };
}

const KEYS = ["co2", "ts", "td", "sThermal", "sGlacier", "sGrIS", "sAIS", "sLandWater", "b", "w", "mPf", "pTh"] as const;
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

/** v2 生物圈/冻土通量（ADR-003 异常口径）：火灾与冻土释放（GtC/yr，超出 GCP 基线的气候反馈）+
 *  水循环箱式诊断。rhs 与碳守恒累积共用同一实现。 */
export function v2Fluxes(s: EarthState, p: Params): { fireF: number; ePf: number; pLand: number; eLand: number; dW: number; dMpf: number } {
  const pLand = water.precipitation(s.ts);
  const eLand = water.evaporation(s.ts);
  const dW = pLand - eLand - water.runoff(s.w, pLand, eLand);
  const v = s.b / 550;
  const drought = Math.max(0, (800 - s.w) / 8);
  const pFire = fire.fireProbability(s.ts, drought, v);
  const fireF = fire.fireFlux(pFire, s.ts, v, p.fire_k);
  const dMpf = permafrost.permafrostThaw(s.mPf, s.ts, p.k_pf, p.t_pf);
  const ePf = permafrost.permafrostRelease(s.pTh, p.r_pf);
  return { fireF, ePf, pLand, eLand, dW, dMpf };
}

/** 完整右端项（SPEC §6.1 因果链 + ADR-003 v2 耦合） */
export function rhs(s: EarthState, d: Drivers, p: Params): EarthState {
  const F = forcing.fTotal(s.co2, d.ch4, d.n2o, d.fOther, p);
  const { fireF, ePf, pLand, eLand, dW, dMpf } = v2Fluxes(s, p);
  const feedbackC = fireF + ePf; // GtC/yr，气候驱动异常（接 eq_15 排放侧）
  return {
    // 排放驱动段：反馈碳进入大气收支。浓度驱动段：co2 由 runSim 的「钉住 + 累积反馈」
    // 公式管理（此处导数置 0，避免反馈碳在 RK4 积分与 cumFB 记账中双重计入）
    co2:
      d.prescribedCo2 !== undefined
        ? 0
        : (d.efossil + d.eluluc + feedbackC - carbon.landSink(s.co2, p) - carbon.oceanSink(s.co2, s.ts, p)) * p.ppm_per_gtc,
    ts: ocean.dTs(F, s.ts, s.td, p),
    td: ocean.dTd(s.ts, s.td, p),
    sThermal: sealevel.dSth(s.ts, s.td, p),
    sGlacier: sealevel.dSglacier(s.ts, s.sGlacier, p),
    sGrIS: sealevel.dSgris(s.ts, p),
    sAIS: sealevel.dSais(s.ts, p),
    sLandWater: p.lw_rate,
    b: bio.biomassDdt(s.b, bioFTemp(s.ts), bioFPrecip(s.ts), bioFWater(s.w), bioFCo2(s.co2), p.r_veg, p.k_biomass, fireF),
    w: dW,
    mPf: dMpf,
    pTh: -dMpf - ePf,
  };
}

export function runSim(o: RunOptions): RunOutput {
  const sub = o.substeps ?? 2;
  const h = 1 / sub;
  const p = o.params;
  let s: EarthState = { ...o.initialState };
  const co2Start = s.co2;
  const records: YearRecord[] = [];
  let cumE = 0, cumFB = 0, cumL = 0, cumO = 0;
  for (let y = o.startYear; y < o.endYear; y++) {
    for (let i = 0; i < sub; i++) {
      const t = y + i * h;
      const d0 = o.driversAt(t);
      // 浓度驱动模式：钉住 AR6 路径 + 累积气候反馈碳（火灾/冻土）抬升浓度——
      // 反馈排放叠加在浓度路径之上（简单模式加冻土反馈的标准做法）
      if (d0.prescribedCo2 !== undefined) s = { ...s, co2: d0.prescribedCo2 + (cumFB * p.ppm_per_gtc) };
      const k1 = rhs(s, d0, p);
      const mid = axpy(s, h / 2, k1);
      // 碳收支诊断：汇按实际 co2（浓度段 = 钉住 + 反馈抬升）计
      cumL += h * carbon.landSink(mid.co2, p);
      cumO += h * carbon.oceanSink(mid.co2, mid.ts, p);
      const fl = v2Fluxes(mid, p);
      cumFB += h * (fl.fireF + permafrost.permafrostRelease(mid.pTh, p.r_pf));
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
      biomass: s.b, soilMoisture: s.w, permafrost: s.mPf,
    });
  }
  const cumAtmos = (s.co2 - co2Start) / p.ppm_per_gtc;
  const residual = Math.abs(cumE + cumFB - cumAtmos - cumL - cumO);
  return { records, carbon: { cumEmissions: cumE, cumFeedback: cumFB, cumAtmos, cumLand: cumL, cumOcean: cumO, residualRatio: residual / Math.max(cumE + cumFB, 1e-9) } };
}
