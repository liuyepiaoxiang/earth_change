import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { runSim } from "./solver.js";
import { makeHistoricalDrivers, makeScenarioDrivers, initialState } from "./scenario.js";
import { loadSpec, type ScenarioId } from "@future-earth/spec";
import type { Params, SimResult } from "./types.js";

const MODEL_VERSION = "0.1.0";
const paramsFile = JSON.parse(readFileSync(new URL("../params.json", import.meta.url), "utf8"));

function baseParams(): Params {
  const p: Record<string, number> = { ...paramsFile.values };
  for (const x of loadSpec().parameters) if (!(x.id in p)) p[x.id] = x.default;
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
    paramsFingerprint: "sha256:" + createHash("sha256").update(JSON.stringify(paramsFile.values)).digest("hex").slice(0, 16),
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
