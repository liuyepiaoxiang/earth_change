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
