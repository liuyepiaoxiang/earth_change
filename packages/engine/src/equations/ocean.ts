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
