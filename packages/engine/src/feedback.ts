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
