import { createHash } from "node:crypto";
import { runSim } from "./solver.js";
import { makeHistoricalDrivers, makeScenarioDrivers, initialState } from "./scenario.js";
import { PARAMETER_DEFAULTS, type ScenarioId } from "@future-earth/spec";
import { CALIBRATED_PARAMS } from "./generated/params.gen.js";
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
    paramsFingerprint: "sha256:" + createHash("sha256").update(JSON.stringify(CALIBRATED_PARAMS)).digest("hex").slice(0, 16),
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
