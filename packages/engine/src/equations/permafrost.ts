/** 冻土碳（eq_39–40，v2，ADR-003 异常口径）：气候驱动的冻土融化与碳释放。
 *  M_pf（GtC）为状态量（NCSCD 量级 ~1400），P_thawed 为已融碳池（释放源）。
 *  释放按 CO₂ 份额 1.0 简化（CH₄ 份额对浓度路径的影响注记忽略，v2 口径）。 */

/** eq_39: 冻土融化速率 dM_pf/dt = −k_pf·max(ΔT − T_pf, 0)（返回负增量，GtC/yr） */
export function permafrostThaw(mPf: number, dTs: number, kPf = 30, tPf = 1.0): number {
  const thaw = kPf * Math.max(0, dTs - tPf);
  return -Math.min(mPf, thaw); // 库不穿底
}

/** eq_40: 冻土碳释放 E_pf = r_pf·P_thawed（GtC/yr，CO₂ 口径） */
export function permafrostRelease(pThawed: number, rPf = 0.02): number {
  return Math.max(0, pThawed) * rPf;
}
