import { runSim } from "./solver.js";
import { makeHistoricalDrivers, makeScenarioDrivers, initialState } from "./scenario.js";
import { PARAMETER_DEFAULTS, type ScenarioId } from "@future-earth/spec";
import { CALIBRATED_PARAMS, PARAMS_FINGERPRINT } from "./generated/params.gen.js";
import { manifestHash } from "@future-earth/data";
import type { Params, SimResult } from "./types.js";

const MODEL_VERSION = "0.2.0";
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
    schemaVersion: 2, modelVersion: MODEL_VERSION, scenario: id,
    paramsFingerprint: PARAMS_FINGERPRINT,
    metadata: {
      modelScope: "global-box",
      driverMode: "hybrid",
      driverSegments: [
        { from: 1850, to: 2024, mode: "emissions-driven" },
        { from: 2025, mode: "concentration-driven" },
      ],
      confidenceNotes: [
        { from: 1850, to: 2024, label: "历史复现段（GISTEMP/NOAA 校准）" },
        { from: 2025, to: 2100, label: "IPCC AR6 校准区间" },
        { from: 2101, label: "探索性外推（低置信度）" },
      ],
      dataManifestHash: manifestHash(),
    },
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
      biomass: recs.map((r) => +r.biomass.toFixed(1)),
      soilMoisture: recs.map((r) => +r.soilMoisture.toFixed(1)),
      permafrost: recs.map((r) => +r.permafrost.toFixed(1)),
    },
  };
}

// 降尺度纯函数：web 客户端直接复用（同源实现，避免前端重写公式）
export {
  patternAmp, localDTs, scaledPrecip,
  isCityFlooded, isLandAboveSea, classifyBiome,
} from "./equations/downscale.js";
export type { WarmingPatternBand } from "./equations/downscale.js";
// 海冰与冰-反照率诊断（eq_28–30，ADR-001）
export { seaIceArea, surfaceAlbedo, iceAlbedoFeedback } from "./equations/seaice.js";
// 不确定性量化（v1）
export { runScenarioMc, PERTURBED_IDS } from "./mc.js";
export type { McResult, McBand } from "./mc.js";
export type { SimResult } from "./types.js";
export type { ScenarioId } from "@future-earth/spec";
