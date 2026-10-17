import { runSim } from "./solver.js";
import { makeHistoricalDrivers, makeScenarioDrivers, initialState } from "./scenario.js";
import { PARAMETER_DEFAULTS, type ScenarioId } from "@future-earth/spec";
import { CALIBRATED_PARAMS, PARAMS_FINGERPRINT } from "./generated/params.gen.js";
import { manifestHash } from "@future-earth/data";
import { checkStability } from "./stability.js";
import { RECOVERY_TAU } from "./feedback.js";
import type { Params, SimResult } from "./types.js";

import { MODEL_VERSION } from "./version.js";
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
    warnings: checkStability(recs),
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
      diagnostics: {
        forcing: {
          co2: recs.map((r) => +r.forcingCo2.toFixed(3)),
          ch4: recs.map((r) => +r.forcingCh4.toFixed(3)),
          n2o: recs.map((r) => +r.forcingN2o.toFixed(3)),
          other: recs.map((r) => +r.forcingOther.toFixed(3)),
          total: recs.map((r) => +r.forcing.toFixed(3)),
        },
        oceanHeatUptake: recs.map((r) => +r.oceanHeatUptake.toFixed(3)),
        seaIceArea: recs.map((r) => +r.seaIceArea.toFixed(2)),
        water: {
          precip: recs.map((r) => +r.precip.toFixed(1)),
          evap: recs.map((r) => +r.evap.toFixed(1)),
          runoff: recs.map((r) => +r.runoff.toFixed(1)),
        },
        bio: {
          npp: recs.map((r) => +r.npp.toFixed(2)),
          fireAnomaly: recs.map((r) => +r.fireAnomaly.toFixed(3)),
        },
        carbon: {
          npp: recs.map((r) => +r.npp.toFixed(2)),
          rh: recs.map((r) => +r.rh.toFixed(2)),
          soilCarbonProxy: recs.map((r) => +r.soilCarbonProxy.toFixed(1)),
          permafrostCo2: recs.map((r) => +r.permafrostCo2.toFixed(3)),
          permafrostCh4: recs.map((r) => +r.permafrostCh4.toFixed(3)),
          fireF: recs.map((r) => +r.fireAnomaly.toFixed(3)),
          recoveryTau: recs.map(() => RECOVERY_TAU),
        },
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
// 海冰与冰-反照率诊断（eq_28–30，ADR-001）
export { seaIceArea, surfaceAlbedo, iceAlbedoFeedback } from "./equations/seaice.js";
// 不确定性量化（v1）
export { runScenarioMc, PERTURBED_IDS } from "./mc.js";
export { checkStability } from "./stability.js";
export { reportCarbonClosure } from "./closure.js";
export type { ClosureReport } from "./closure.js";
export { runExperiment, reshapeEmissions, ExperimentControlsSchema, DEFAULT_CONTROLS } from "./experiment.js";
export type { ExperimentControls } from "./experiment.js";
export { crossingYears } from "./thresholds.js";
export type { CrossingYears } from "./thresholds.js";
export { MODEL_VERSION } from "./version.js";
export { PF_CO2_SHARE, PF_CH4_SHARE, RECOVERY_TAU, rhFromClosure, landSinkWithWater, SOIL_WATER_REF } from "./feedback.js";
export type { McResult, McBand } from "./mc.js";
export type { SimResult } from "./types.js";
export type { ScenarioId } from "@future-earth/spec";
export {
  GRID, ampField, anomalyField, temperatureField, precipField, globalDT,
  cellWaterTimeline, gridSeaIceFraction, gridBiome, sampleGrid, regionStats, runGridFields,
  cellLat, cellLon,
} from "./grid.js";
export type { Field, GridFields, RegionStats, CellWaterSeries, SimLike } from "./grid.js";
