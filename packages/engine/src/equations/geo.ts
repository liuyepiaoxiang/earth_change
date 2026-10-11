/** 地貌演化诊断链（eq_41–48，v3，ADR-001 诊断式模式）。
 *  v0/v1/v2 数据形态下（无格点时间积分）实现为「侵蚀潜势」标量诊断：
 *  输入为气候箱输出（径流/植被/海平面），输出为相对侵蚀/沉积速率与海岸位置变化
 *  （m/yr，相对基准），供城市面板与 v3 后期格点积分预研。
 *  量级基准：全球平均侵蚀速率 ~0.05–0.5 mm/yr；海岸侵蚀 ~0.1–1 m/yr。 */

/** eq_41: 坡度诊断 Slope = |∇Z| ≈ ΔZ/Δx。格点差分版属 v3 后期（V3-01 数据结构） */
export function slope(dz: number, dx: number): number {
  if (dx <= 0) throw new Error("dx 必须为正");
  return Math.abs(dz) / dx;
}

/** eq_42: 河流侵蚀 E_river = K·Q^m·S^n（m/yr，量纲标定）。Q 相对基准径流（1=基准），S 无量纲坡度 */
export function riverErosion(qRel: number, s: number, k = 0.05, m = 1.6, n = 1.0): number {
  if (qRel < 0 || s < 0) return 0;
  return k * qRel ** m * s ** n;
}

/** eq_43: 地表侵蚀 E_soil = Kr·R（R 相对基准径流/降水，1=基准） */
export function surfaceErosion(rRel: number, kR = 0.1): number {
  return Math.max(0, kR * Math.max(0, rRel));
}

/** eq_44: 植被抗侵蚀 E_eff = E_soil·(1 − c·V)。V 植被覆盖 [0,1.5]，c=0.8（全植被抑制 80%） */
export function vegetationShield(eSoil: number, v: number, c = 0.8): number {
  const eff = 1 - c * Math.min(1, Math.max(0, v));
  return Math.max(0, eSoil * eff);
}

/** eq_45: 沉积收支 dSed/dt = T_in − T_out（质量守恒：输入−输出；正=净沉积） */
export function sedimentBudget(tIn: number, tOut: number): number {
  return tIn - tOut;
}

/** eq_46: 河流输沙 Q_sed = Ks·Q^a·S^b（与 eq_42 同构，系数独立标定） */
export function sedimentTransport(qRel: number, s: number, kS = 0.03, a = 1.5, b = 0.9): number {
  if (qRel < 0 || s < 0) return 0;
  return kS * qRel ** a * s ** b;
}

/** eq_47: 高程变化 dZ/dt = 沉积 − 侵蚀（m/yr；格点积分版属 V3-01） */
export function elevationChange(deposition: number, erosion: number): number {
  return deposition - erosion;
}

/** eq_48: 海岸侵蚀 E_coast = Kw·SLR^c（m/yr，SLR 为海平面上升 m）。Brunn 规则箱式：
 *  海岸后退 ≈ (L_depth/B_height)·SLR 增量，系数 Kw 标定到量级 */
export function coastalErosion(slr: number, kW = 0.15, c = 1.0): number {
  return Math.max(0, kW * Math.max(0, slr) ** c);
}
