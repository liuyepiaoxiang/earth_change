/** 火灾诊断（eq_37–38，v2，ADR-003 异常口径）：气候驱动的火灾**异常通量**。
 *  基线火灾排放（~2 GtC/yr）已隐含在 GCP 排放数据内——本模块只建模超出基线的
 *  气候反馈部分（暖化 + 干旱 → 火灾概率与损失上升），防双重计入。 */

/** eq_37: 火灾概率 P_fire = σ(a·ΔT + b·D)，D 为干旱指数（0–100，土壤水分亏缺百分比）。
 *  常量 a/b 为量级标定（文献区间），不确定性走 MC 扰动。 */
export function fireProbability(dTs: number, droughtIdx: number, v = 1): number {
  const x = 0.1 * dTs + 0.01 * droughtIdx;
  const p = 1 / (1 + Math.exp(-x));
  return Math.min(1, p) * Math.min(1, Math.max(0, v));
}

/** eq_38: 火灾损失通量（GtC/yr，气候异常口径）= P_fire · fire_k · max(ΔT, 0) · V */
export function fireFlux(pFire: number, dTs: number, v = 1, fireK = 0.3): number {
  return pFire * fireK * Math.max(0, dTs) * Math.min(1, Math.max(0, v));
}
