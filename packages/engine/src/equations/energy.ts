/** 辐射能量平衡显式诊断（eq_01–05，v1.x 收尾批，ADR-001 诊断式模式）。
 *  与 v0 隐式处理（forcing 数据 + 两层 EBM）数值口径不同——消费方须标注「显式能量收支（诊断口径）」。
 *  常量为标准气候学值：S0 太阳常数、σ Stefan-Boltzmann、ε 地表有效发射率。 */
const S0 = 1361; // W/m² 太阳常数
const SIGMA = 5.670374419e-8; // W/(m²·K⁴)
const EPSILON = 0.98; // 地表有效发射率

/** eq_01: 太阳入射 Q_in = (S0/4)(1+δS)。δS 为太阳常数相对扰动（v0 无太阳变化数据 → 0） */
export function qIn(deltaS = 0): number {
  return (S0 / 4) * (1 + deltaS);
}

/** eq_02: 反射太阳辐射 Q_ref = α·Q_in。α 来自 eq_29 地表反照率诊断 */
export function qRef(alpha: number, qInW = qIn()): number {
  return alpha * qInW;
}

/** eq_03: 吸收太阳辐射 Q_abs = (1−α)·Q_in */
export function qAbs(alpha: number, qInW = qIn()): number {
  return (1 - alpha) * qInW;
}

/** eq_04: 射出长波 Q_out = ε·σ·Te⁴。Te 为有效发射温度（K） */
export function qOut(teK: number): number {
  return EPSILON * SIGMA * teK ** 4;
}

/** eq_05: 净辐射 N = Q_abs − Q_out（正 = 地气系统加热） */
export function netRadiation(qAbsW: number, qOutW: number): number {
  return qAbsW - qOutW;
}
