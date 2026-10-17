/** V4.0 分层不确定性框架——参数/情景/结构三源可独立开关（U-02）
 *  U-03：MC 区间明确标注为「参数不确定性」而非 AR6 共识区间。 */
import { runScenarioMc, runScenario } from "./index.js";
import type { ScenarioId } from "@future-earth/spec";
import type { McResult } from "./mc.js";
import type { SimResult as Sim } from "./types.js";
import { PARAMETER_DEFAULTS } from "@future-earth/spec";
import { CALIBRATED_PARAMS } from "./generated/params.gen.js";

export type UncertaintySource = "parameter" | "scenario" | "structural";

export interface UncertaintyLayers {
  parameter: boolean;
  scenario: boolean;
  structural: boolean;
}
export const DEFAULT_LAYERS: UncertaintyLayers = { parameter: true, scenario: true, structural: false };

export interface LayeredBand {
  year: number;
  /** 参数不确定性 p10–p90（MC） */
  parameterBand?: { p10: number; p50: number; p90: number };
  /** 情景不确定性：四 SSP 最小–最大 */
  scenarioBand?: { min: number; max: number };
  /** 结构不确定性：结构变体（v1.5 反馈开/关）差异 */
  structuralBand?: { low: number; high: number };
}

export interface UncertaintyResult {
  modelVersion: string;
  /** U-03：口径声明 */
  interpretation: string;
  layersUsed: UncertaintyLayers;
  milestones: Array<{ year: number } & LayeredBand>;
  seed: number;
}

/** U-01：同 seed 可复现；分布统计稳定 */
export function runLayeredUncertainty(
  scenario: ScenarioId,
  years: number[] = [2030, 2050, 2100, 2200, 2500],
  layers: UncertaintyLayers = DEFAULT_LAYERS,
  mcOpts: { n?: number; seed?: number } = {},
): UncertaintyResult {
  const seed = mcOpts.seed ?? 20261017;
  const milestones: UncertaintyResult["milestones"] = [];

  // 参数层：MC
  let mc: McResult | null = null;
  if (layers.parameter) mc = runScenarioMc(scenario, 2500, { n: mcOpts.n ?? 100, seed });

  // 情景层：四 SSP
  const allSsp: Sim[] = layers.scenario
    ? (["ssp126", "ssp245", "ssp370", "ssp585"] as const).map((id) => runScenario(id, 2500))
    : [];
  // 结构层：反馈开/关
  const structuralVariants: Sim[] = layers.structural
    ? [runScenario(scenario, 2500)] // 当前默认（反馈关）；开启版需 params 注入，此处仅框架
    : [];

  for (const y of years) {
    const entry: { year: number } & LayeredBand = { year: y };
    if (mc) {
      const i = mc.years.indexOf(y);
      if (i >= 0) {
        entry.parameterBand = { p10: mc.tempAnomaly.p10[i]!, p50: mc.tempAnomaly.p50[i]!, p90: mc.tempAnomaly.p90[i]! };
      }
    }
    if (allSsp.length > 0) {
      const vals = allSsp.map((s) => {
        const i = s.years.indexOf(y);
        return i >= 0 ? s.metrics.tempAnomaly[i]! : s.metrics.tempAnomaly.at(-1)!;
      });
      entry.scenarioBand = { min: Math.min(...vals), max: Math.max(...vals) };
    }
    if (structuralVariants.length > 0) {
      const vals = structuralVariants.map((s) => {
        const i = s.years.indexOf(y);
        return i >= 0 ? s.metrics.tempAnomaly[i]! : s.metrics.tempAnomaly.at(-1)!;
      });
      entry.structuralBand = { low: Math.min(...vals), high: Math.max(...vals) };
    }
    milestones.push(entry);
  }

  return {
    modelVersion: "4.0.0",
    interpretation: "参数不确定性 = MC 先验采样（非 AR6 共识区间）；情景不确定性 = 四 SSP 范围（AR6 校准锚定）；结构不确定性 = 反馈开关变体（探索性）",
    layersUsed: layers,
    milestones,
    seed,
  };
}
