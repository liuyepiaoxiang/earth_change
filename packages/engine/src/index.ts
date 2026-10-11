import { runSim } from "./solver.js";
import { makeHistoricalDrivers, makeScenarioDrivers, initialState } from "./scenario.js";
import { PARAMETER_DEFAULTS, type ScenarioId } from "@future-earth/spec";
import { CALIBRATED_PARAMS, PARAMS_FINGERPRINT } from "./generated/params.gen.js";
import type { Params, SimResult } from "./types.js";

const MODEL_VERSION = "0.1.0";
function baseParams(): Params {
  const p: Record<string, number> = { ...PARAMETER_DEFAULTS, ...CALIBRATED_PARAMS };
  return p as Params;
}

/** 运行一个情景：历史 1850-2024 串联情景 2025-horizon（浓度驱动），输出版本化 SimResult */
export function runScenario(id: ScenarioId, horizon = 2500): SimResult {
  const p = baseParams();
  const dh = makeHistoricalDrivers();
  const ds = makeScenarioDrivers(id);
  const recs = runSim({
    startYear: 1850, endYear: horizon, initialState: initialState(),
    driversAt: (y) => (y <= 2024 ? dh(y) : ds(y)), params: p,
  }).records;
  return {
    schemaVersion: 1, modelVersion: MODEL_VERSION, scenario: id,
    paramsFingerprint: PARAMS_FINGERPRINT,
    years: recs.map((r) => r.year),
    metrics: {
      tempAnomaly: recs.map((r) => +r.tempAnomaly.toFixed(3)),
      co2: recs.map((r) => +r.co2.toFixed(2)),
      seaLevel: {
        total: recs.map((r) => +r.seaLevel.toFixed(4)),
        thermal: recs.map((r) => +r.slThermal.toFixed(4)),
        glacier: recs.map((r) => +r.slGlacier.toFixed(4)),
        iceSheet: recs.map((r) => +r.slIceSheet.toFixed(4)),
        landWater: recs.map((r) => +r.slLandWater.toFixed(4)),
      },
    },
  };
}

// 降尺度纯函数：web 客户端直接复用（同源实现，避免前端重写公式）
export {
  patternAmp, localDTs, scaledPrecip,
  isCityFlooded, isLandAboveSea, classifyBiome,
} from "./equations/downscale.js";
export type { WarmingPatternBand } from "./equations/downscale.js";
// 不确定性量化（v1）
export { runScenarioMc, PERTURBED_IDS } from "./mc.js";
export type { McResult, McBand } from "./mc.js";
export type { SimResult } from "./types.js";
export type { ScenarioId } from "@future-earth/spec";
