import { describe, it, expect } from "vitest";
import { runScenario } from "./index.js";
import { runSim } from "./solver.js";
import { makeHistoricalDrivers, makeScenarioDrivers, initialState } from "./scenario.js";
import { PARAMETER_DEFAULTS } from "@future-earth/spec";
import { CALIBRATED_PARAMS } from "./generated/params.gen.js";
import type { Params } from "./types.js";

const p: Params = { ...PARAMETER_DEFAULTS, ...CALIBRATED_PARAMS };
const dh = makeHistoricalDrivers();
const ds = makeScenarioDrivers("ssp245");
const raw = runSim({
  startYear: 1850, endYear: 2500, initialState: initialState(),
  driversAt: (y) => (y <= 2024 ? dh(y) : ds(y)), params: p,
}).records;

describe("v0.2 诊断统一与 G7/G8 门（V02-E01/E04）", () => {
  it("诊断字段全部有限且量级合理", () => {
    for (const r of raw) {
      for (const v of [r.forcingCo2, r.forcingCh4, r.forcingN2o, r.forcingOther, r.oceanHeatUptake, r.seaIceArea, r.precip, r.evap, r.runoff, r.npp, r.fireAnomaly])
        expect(Number.isFinite(v), `${r.year}`).toBe(true);
    }
    expect(raw.at(-1)!.seaIceArea).toBeLessThan(raw[10]!.seaIceArea); // 升温 → 海冰缩减
  });
  it("G7：逐年 |F_CO2+F_CH4+F_N2O+F_other − F_total| < 1e-9（原始记录）", () => {
    for (const r of raw) {
      const sum = r.forcingCo2 + r.forcingCh4 + r.forcingN2o + r.forcingOther;
      expect(Math.abs(sum - r.forcing), `${r.year}`).toBeLessThan(1e-9);
    }
  });
  it("G7（契约层）：SimResult 诊断分量和 = total（舍入容差 0.01）", () => {
    const sim = runScenario("ssp245", 2100);
    const dg = sim.metrics.diagnostics!;
    for (let i = 0; i < sim.years.length; i++) {
      const sum = dg.forcing.co2[i]! + dg.forcing.ch4[i]! + dg.forcing.n2o[i]! + dg.forcing.other[i]!;
      expect(Math.abs(sum - dg.forcing.total[i]!), `year=${sim.years[i]}`).toBeLessThan(0.01);
    }
  });
  it("G8：逐年海平面分量和 = total（原始 1e-12 / 契约舍入 0.001）", () => {
    for (const r of raw)
      expect(Math.abs(r.slThermal + r.slGlacier + r.slIceSheet + r.slLandWater - r.seaLevel), `${r.year}`).toBeLessThan(1e-12);
    const sim = runScenario("ssp245", 2100);
    const sl = sim.metrics.seaLevel;
    for (let i = 0; i < sim.years.length; i++) {
      const sum = sl.thermal[i]! + sl.glacier[i]! + sl.iceSheet[i]! + sl.landWater[i]!;
      expect(Math.abs(sum - sl.total[i]!)).toBeLessThan(0.001);
    }
  });
});
