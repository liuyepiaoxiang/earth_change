/** 植被动态（eq_33–36，v2，ADR-003 全球聚合箱）：B（GtC）为状态量，V = B/B₀ 为相对覆盖。
 *  结构：logistic 净增长（r 为净速率，死亡/呼吸已并入）+ 承载力 K 随 CO₂ 施肥增长 +
 *  火灾异常通量扣除。B₀ = 550 GtC = 1850 年稳态（植被生物量观测量级）。 */
import type { Params } from "../types.js";

export const B0 = 550; // GtC，1850 年植被生物量稳态（= k_biomass 先验中心）
const V_MAX = 1.5; // 相对覆盖上限（施肥过冲裕度）

/** fCO₂ 施肥：1 + f_co2_beta·ln(C/C0)（与 eq_16 陆地汇同型） */
export function fCo2(c: number, c0 = 280, fCo2Beta = 0.4): number {
  return Math.max(0, 1 + fCo2Beta * Math.log(c / c0));
}

/** fT 温度响应：生长季延长小幅增益，线性弱敏感（形状不确定性走 MC） */
export function fTemp(dTs: number): number {
  return Math.max(0.3, 1 + 0.05 * dTs);
}

/** fW 土壤水分响应：W/W₀（相对初值 800mm） */
export function fWater(w: number, w0 = 800): number {
  return Math.max(0, w / w0);
}

/** fP 降水响应：与 eq_52 标量缩放同式（1 + 0.02·ΔT） */
export function fPrecip(dTs: number): number {
  return Math.max(0, 1 + 0.02 * dTs);
}

/** 承载力 K = k_biomass·fCO2（GtC） */
export function carryingCapacity(kBiomass: number, fCO2: number): number {
  return Math.max(0, kBiomass * fCO2);
}

/** eq_33: 生长 = r·fT·fP·fW·fCO2·B·(1 − B/K)（logistic 净增长） */
export function growth(
  b: number, k: number, fT: number, fP: number, fW: number, fCO2: number, rVeg = 0.015,
): number {
  if (k <= 0) return 0;
  return rVeg * fT * fP * fW * fCO2 * b * Math.max(0, 1 - b / k);
}

/** eq_34: 死亡诊断分项 Death = m·V·B₀（m 为相对折损率；净形式下与生长合并，此函数供独立查询） */
export function death(b: number, m = 0.02): number {
  return m * b;
}

/** eq_36: NPP = npp_max·V·fT·fCO2·fP·fW（诊断量，GtC/yr） */
export function npp(b: number, nppMax: number, fT: number, fCO2: number, fP: number, fW: number): number {
  const v = b / B0;
  return Math.max(0, nppMax * v * fT * fCO2 * fP * fW);
}

//** eq_35: dV/dt = (1/B₀)·dB/dt —— 与 eq_18 净形式同源（火灾由调用方并入； death 分项 eq_34 为独立诊断） */
export function vegetationDdt(
  b: number, fT: number, fP: number, fW: number, fCO2: number, rVeg = 0.015, kBiomass = B0, fireFlux = 0,
): number {
  return biomassDdt(b, fT, fP, fW, fCO2, rVeg, kBiomass, fireFlux) / B0;
}

/** eq_18: 生物量碳收支 dB/dt = NPP − Rh − ΔFire（NPP 内含自养呼吸净额，Rh 已并入 logistic 净速率） */
export function biomassDdt(
  b: number,
  fT: number,
  fP: number,
  fW: number,
  fCO2: number,
  rVeg: number,
  kBiomass: number,
  fireFlux: number,
): number {
  const k = carryingCapacity(kBiomass, fCO2);
  if (k <= 0 || b <= 0) return -fireFlux;
  return rVeg * fT * fP * fW * fCO2 * b * Math.max(0, 1 - b / k) - fireFlux;
}
