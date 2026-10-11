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
