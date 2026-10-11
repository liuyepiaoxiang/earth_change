/** 水循环诊断链（eq_19–24，v1.x 收尾批，ADR-001 诊断式模式）：全球陆地聚合箱。
 *  与 F12 的降水格点（WorldClim 基准）衔接：格点空间层留 V1-10（需 WorldClim tavg 网格），
 *  本模块提供时间维度的箱式诊断。常量为陆地量级基准（GPCP/GRDC 观测）：
 *  陆地年均降水 ≈840 mm/yr、蒸发 ≈500 mm/yr、径流 ≈340 mm/yr、土壤持水容量 ≈1500 mm。 */

/** eq_19: 降水 P = P0·(1+0.02·ΔT)（与 eq_52 标量缩放同式，全球陆地箱） */
export function precipitation(dTs: number, p0 = 840): number {
  return p0 * (1 + 0.02 * dTs);
}

/** eq_20: 蒸发 E = E0·(1+0.06·ΔT)——Clausius-Clapeyron 6%/°C 线性化（qs−qa 差的箱式近似） */
export function evaporation(dTs: number, e0 = 500): number {
  return Math.max(0, e0 * (1 + 0.06 * dTs));
}

/** eq_22: 径流 R = 超出土壤剩余容量的有效输入（P−E 的溢出部分），干旱期 0 */
export function runoff(w: number, p: number, e: number, wMax = 1500): number {
  const eff = p - e;
  if (eff <= 0) return 0;
  return Math.max(0, eff - (wMax - w));
}

/** eq_21: 水量平衡一步 dW/dt = P − E − R（返回新土壤水，容量钳制 [0, W_MAX]） */
export function waterBalanceStep(w: number, p: number, e: number, wMax = 1500): number {
  const r = runoff(w, p, e);
  return Math.min(wMax, Math.max(0, w + p - e - r));
}

/** eq_23: 土壤水一步 dWs/dt = P − ET − I + Capillary（毛管项 v0 箱式为 0，同 eq_21 口径） */
export function soilWaterStep(w: number, p: number, e: number, wMax = 1500): number {
  return waterBalanceStep(w, p, e, wMax);
}

/** eq_24: 积雪一步 dMsnow/dt = Psnow − Melt。雪 = 冰点以下降水全部；融化 = 年化度日 k·max(T,0)。
 *  tAbsLocal 为局地绝对温度（基准气候 + ΔT），msnow 单位 mm 水当量。 */
export function snowStep(msnow: number, p: number, tAbsLocal: number, ddf = 180): number {
  const psnow = tAbsLocal < 0 ? p : 0;
  const melt = ddf * Math.max(0, tAbsLocal);
  return Math.max(0, msnow + psnow - melt);
}
