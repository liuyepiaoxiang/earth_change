/** V1.5 反馈侧升级——Phase C 碳循环增强记账（纯诊断，零耦合路径改动）
 *  可回滚构造：本期不引入任何 strength 参数——全部为既有量的会计分解，G1–G6 逐位不动。 */

/** 冻土释放的 CO₂/CH₄ 文献份额（好氧/厌氧分解近似，IPCC 冻土报告量级） */
export const PF_CO2_SHARE = 0.6;
export const PF_CH4_SHARE = 0.4;

/** 植被恢复时间尺度 τ = 1/m（bio.death 默认 m = 0.02/yr → 50 年） */
export const RECOVERY_TAU = 50;

/** 土壤异养呼吸 Rh（闭合会计：由 landSink ≡ NPP − Rh 反解，标记为记账分解而非新模型） */
export function rhFromClosure(npp: number, landSinkValue: number): number {
  return npp - landSinkValue;
}

/** V1.5 Phase B：水循环→陆汇耦合（可回滚构造）
 *  landSink_coupled = landSink_base × [1 + s·(w − W₀)/W₀]，W₀ = 800 mm（工业化前稳态）
 *  s = 0（默认）→ 恒等于 landSink_base（与 v1.0 逐位一致，可机器证明）。 */
export const SOIL_WATER_REF = 800;
export function landSinkWithWater(base: number, w: number, strength: number): number {
  if (strength === 0) return base;
  return base * (1 + strength * (w - SOIL_WATER_REF) / SOIL_WATER_REF);
}

/** V1.5 Phase A：冰-反照率反馈（可回滚构造，海冰损失 → 正强迫）
 *  A_i(T)：全球海冰面积诊断（seaice.ts logistic）；A₀ = 9.5×10⁶ km²。
 *  ΔF_albedo = −s · 0.3 · ΔA_i(T) / A₀  [W/m²]，ΔA = A₀ − max(A_i, 0.3·A₀)（饱和下界）
 *  s = 0（默认）→ ΔF ≡ 0（与 v1.0 逐位一致）。0.3 W/m²/K 为文献量级（海冰反照率反馈）。 */
import { seaIceArea } from "./equations/seaice.js";
export const ICE_ALBEDO_COEF = 0.3; // W/m²/K 等效（海冰完全消失时 ~0.3×ΔT_sens）
export const ICE_AREA_FLOOR_FRAC = 0.3; // 饱和下界：海冰面积不低于 30% A₀

export function iceAlbedoForcing(ts: number, strength: number): number {
  if (strength === 0) return 0;
  const A0 = 9.5;
  const Ai = Math.max(seaIceArea(ts), ICE_AREA_FLOOR_FRAC * A0);
  const dA = A0 - Ai; // 损失量（正 = 冰少 = 吸收多 = 正强迫）
  return strength * ICE_ALBEDO_COEF * (dA / A0); // dA 饱和 → ΔF 饱和（无温度发散因子）
}
