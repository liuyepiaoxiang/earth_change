/** 单层温度响应对比诊断（eq_10，v1.x 收尾批，ADR-001 诊断式模式）。
 *  与 v0 两层 EBM（eq_11/12）并行运行的离线积分——用于展示「单层 vs 两层」响应差异
 *  （单层缺失深海慢响应 → 多年代际 drift 被低估）。不接入 solver RHS。
 *  偏差说明：eq_10 公式含 γ(Ta−To) 耦合项；对比诊断取深海 To 固定为 0（未扰动深海），
 *  这是与两层模型可对照的最简口径（SPEC §4.4 注记「v0 由 eq_11/12 两层形式涵盖」。 */
import type { Params } from "../types.js";

export interface SingleLayerSeries {
  year: number;
  ta: number; // 单层温度异常 K
}

/** 积分单层模型：Ca·dTa/dt = F(t) − λ·Ta − γ·(Ta − To)，To 常量（默认 0） */
export function runSingleLayer(
  years: { start: number; end: number },
  forcingAt: (year: number) => number,
  params: Pick<Params, "lambda" | "gamma_ocean" | "c_s">,
  opts: { to?: number; ta0?: number } = {},
): SingleLayerSeries[] {
  const to = opts.to ?? 0;
  const ca = params.c_s;
  const lambda = params.lambda;
  const gamma = params.gamma_ocean;
  const out: SingleLayerSeries[] = [];
  let ta = opts.ta0 ?? 0;
  for (let y = years.start; y <= years.end; y++) {
    out.push({ year: y, ta: +ta.toFixed(4) });
    const F = forcingAt(y);
    ta = ta + (F - lambda * ta - gamma * (ta - to)) / ca;
  }
  return out;
}

/** 平衡态解析解：Ta_eq = (F + γ·To) / (λ + γ)（用于校验积分收敛） */
export function singleLayerEquilibrium(F: number, params: Pick<Params, "lambda" | "gamma_ocean">, to = 0): number {
  return (F + params.gamma_ocean * to) / (params.lambda + params.gamma_ocean);
}
