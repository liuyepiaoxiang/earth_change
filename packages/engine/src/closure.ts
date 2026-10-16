/** V02-E03 反馈闭合报告：排放驱动段守恒核算 + 浓度驱动段口径说明 */
import { runSim } from "./solver.js";
import { makeHistoricalDrivers, initialState } from "./scenario.js";
import { PARAMETER_DEFAULTS, type ScenarioId } from "@future-earth/spec";
import { CALIBRATED_PARAMS } from "./generated/params.gen.js";
import type { Params } from "./types.js";

export interface ClosureReport {
  /** 排放驱动段（1850-2024）碳质量守恒核算，单位 GtC */
  historical: {
    cumEmissions: number; cumFeedback: number; cumAtmos: number; cumLand: number; cumOcean: number;
    residualRatio: number;
    closed: boolean; // residualRatio < 1e-2
  };
  /** 浓度驱动段（2025+）：CO₂ 为外生浓度路径，陆汇/海汇/冻土-火灾反馈为诊断量而非闭合项 */
  scenarioNote: string;
  scenario: ScenarioId;
}

export function reportCarbonClosure(id: ScenarioId): ClosureReport {
  const p: Params = { ...PARAMETER_DEFAULTS, ...CALIBRATED_PARAMS };
  const out = runSim({
    startYear: 1850, endYear: 2024, initialState: initialState(),
    driversAt: makeHistoricalDrivers(), params: p,
  });
  const c = out.carbon;
  return {
    historical: {
      cumEmissions: +c.cumEmissions.toFixed(1), cumFeedback: +c.cumFeedback.toFixed(1),
      cumAtmos: +c.cumAtmos.toFixed(1), cumLand: +c.cumLand.toFixed(1), cumOcean: +c.cumOcean.toFixed(1),
      residualRatio: +c.residualRatio.toExponential(2), closed: c.residualRatio < 1e-2,
    },
    scenarioNote: "2025 起 CO₂ 为 Meinshausen 2020 外生浓度路径：陆汇/海汇/冻土-火灾反馈碳通量为诊断量，不再构成大气收支闭合项（避免双重计入，见 solver rhs 注释）",
    scenario: id,
  };
}
