/** V0.3 情景实验室：用户自定义实验（排放驱动）——与 SSP 浓度驱动（AR6 锚定）对照
 *  口径：实验为教育性外推，未经 AR6 区间锚定；碳循环自 2025 起自由运行（排放驱动）。 */
import { z } from "zod";
import { runSim } from "./solver.js";
import { makeHistoricalDrivers, initialState } from "./scenario.js";
import { loadScenario } from "@future-earth/data";
import { manifestHash } from "@future-earth/data";
import { PARAMETERS, PARAMETER_DEFAULTS, type ScenarioId } from "@future-earth/spec";
import { CALIBRATED_PARAMS, PARAMS_FINGERPRINT } from "./generated/params.gen.js";
import { checkStability } from "./stability.js";
import { MODEL_VERSION } from "./version.js";
import type { Drivers, Params, SimResult } from "./types.js";

export const ExperimentControlsSchema = z.object({
  emissionScale: z.number().min(0.5).max(1.5),          // 相对基准路径倍率
  declineStart: z.number().int().min(2025).max(2100),   // 减排起始年
  netZeroYear: z.number().int().min(2030).max(2200),    // 净零年份
  methanePath: z.enum(["low", "medium", "high"]),
  lulucPath: z.enum(["low", "medium", "high"]),
  sinkCapacity: z.enum(["conservative", "baseline", "enhanced"]),
  coastalDefense: z.enum(["none", "fixed", "adaptive"]), // 城市暴露（web 端使用，此处回显）
}).refine((c) => c.netZeroYear > c.declineStart, { message: "netZeroYear 必须晚于 declineStart" });

export type ExperimentControls = z.infer<typeof ExperimentControlsSchema>;
export const DEFAULT_CONTROLS: ExperimentControls = {
  emissionScale: 1, declineStart: 2040, netZeroYear: 2100,
  methanePath: "medium", lulucPath: "medium", sinkCapacity: "baseline", coastalDefense: "none",
};

const lerp = (anchors: Array<[number, number]>, y: number): number => {
  if (y <= anchors[0]![0]) return anchors[0]![1];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [x0, v0] = anchors[i]!, [x1, v1] = anchors[i + 1]!;
    if (y >= x0 && y <= x1) return v0 + ((y - x0) / (x1 - x0)) * (v1 - v0);
  }
  return anchors.at(-1)![1];
};

/** 排放路径变换（纯函数）：scale×基准 → declineStart 前保持 → 线性降至 0 @netZero → +50 年内降至 −2 GtC/yr 并保持 */
export function reshapeEmissions(years: number[], baseEfossil: number[], c: ExperimentControls): number[] {
  const iStart = Math.max(0, years.findIndex((y) => y >= c.declineStart));
  const startVal = baseEfossil[iStart]! * c.emissionScale;
  return years.map((y, i) => {
    if (y < c.declineStart) return baseEfossil[i]! * c.emissionScale;
    if (y <= c.netZeroYear) {
      const t = (y - c.declineStart) / (c.netZeroYear - c.declineStart);
      return startVal * (1 - t);
    }
    return -2 * Math.min((y - c.netZeroYear) / 50, 1);
  });
}

const CH4_PATHS: Record<ExperimentControls["methanePath"], Array<[number, number]>> = {
  low: [[2025, 1930], [2100, 1150], [2500, 1100]],
  medium: [[2025, 1930], [2100, 1800], [2500, 1750]],
  high: [[2025, 1930], [2100, 3400], [2500, 3200]],
};
const LULUC_SCALE = { low: 0.5, medium: 1, high: 1.5 } as const;
const SINK_SCALE = { conservative: 0.85, baseline: 1, enhanced: 1.15 } as const;

function experimentParams(c: ExperimentControls): Params {
  const base: Record<string, number> = { ...PARAMETER_DEFAULTS, ...CALIBRATED_PARAMS };
  const m = SINK_SCALE[c.sinkCapacity];
  for (const id of ["beta_land", "k_ocean"] as const) {
    const rng = PARAMETERS.find((x) => x.id === id)!;
    base[id] = Math.min(rng.max, Math.max(rng.min, base[id]! * m));
  }
  return base as Params;
}

/** 运行教育性实验：历史(排放驱动) + 自定义排放路径(排放驱动) */
export function runExperiment(base: ScenarioId, controlsInput: ExperimentControls, horizon = 2500): SimResult {
  const controls = ExperimentControlsSchema.parse(controlsInput);
  const s = loadScenario(base);
  const p = experimentParams(controls);
  const efossilExp = reshapeEmissions(s.years, s.efossil, controls);
  const at = (arr: number[], y: number): number => {
    const i = s.years.indexOf(y);
    return i >= 0 ? arr[i]! : arr.at(-1)!;
  };
  const dh = makeHistoricalDrivers();
  const driversAt = (y: number): Drivers =>
    y <= 2024 ? dh(y) : {
      year: y,
      efossil: at(efossilExp, Math.round(y)),
      eluluc: at(s.eluluc, Math.round(y)) * LULUC_SCALE[controls.lulucPath],
      ch4: lerp(CH4_PATHS[controls.methanePath], y),
      n2o: at(s.n2o, Math.round(y)),
      fOther: at(s.fOther, Math.round(y)),
      // 注意：无 prescribedCo2 —— 实验段排放驱动，碳循环自由运行
    };
  const recs = runSim({ startYear: 1850, endYear: horizon, initialState: initialState(), driversAt, params: p }).records;
  // 与 runScenario 相同的组装（独立组装以保持二者逐位确定性互不影响）
  return {
    schemaVersion: 2, modelVersion: MODEL_VERSION, scenario: base,
    paramsFingerprint: PARAMS_FINGERPRINT,
    metadata: {
      modelScope: "global-box",
      driverMode: "emissions-driven",
      driverSegments: [{ from: 1850, to: 2024, mode: "emissions-driven" }, { from: 2025, mode: "emissions-driven" }],
      confidenceNotes: [
        { from: 1850, to: 2024, label: "历史复现段（GISTEMP/NOAA 校准）" },
        { from: 2025, label: "教育性实验（用户自定义排放路径），未经 AR6 区间锚定" },
      ],
      dataManifestHash: manifestHash(),
    },
    warnings: checkStability(recs),
    experiment: { base, controls },
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
      },
    },
  };
}
