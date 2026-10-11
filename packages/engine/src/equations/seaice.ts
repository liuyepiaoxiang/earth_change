/** 海冰与冰-反照率诊断（eq_28–30，ADR-001）：纯函数、注册进 registry、不接入 solver RHS。
 *  常量为经验锚点拟合值（1850≈8.9、+1.2°C≈7.4、+4°C≈1.2 M km²，量级对标 NSIDC 观测）。 */

/** eq_28: 海冰面积（logistic 均衡面积，M km²）。dTs = 相对 1850 的全球温度异常（K）。 */
export function seaIceArea(dTs: number): number {
  const A0 = 9.5;
  const T50 = 2.3;
  const k = 0.88;
  const a = A0 / (1 + Math.exp((dTs - T50) / k));
  return Math.max(0, Math.min(A0, a));
}

/** eq_29: 地表反照率（雪被/植被项依赖 v1/v2 变量，缺省 0——见 ADR-001）。 */
export function surfaceAlbedo(areaIce: number, area0 = 9.5): number {
  const alpha0 = 0.3;
  const ki = 0.03; // 每 M km² 冰损失的反照率降幅（全冰损失 ≈ −0.285，对标冰 0.6 → 海 0.06）
  return alpha0 - ki * (area0 - areaIce);
}

/** eq_30: 冰-反照率反馈的辐射当量（W/m²，负值 = 变暖方向）。回路 L2 增益诊断。 */
export function iceAlbedoFeedback(deltaAlpha: number, lambda: number): number {
  const S0 = 1361; // 太阳常数 W/m²
  const cloud = 0.6; // 云量（削弱入射变化对地表的传导）
  return -(S0 / 4) * (1 - cloud) * deltaAlpha;
}
