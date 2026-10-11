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
