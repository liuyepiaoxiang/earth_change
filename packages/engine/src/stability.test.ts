import { describe, it, expect } from "vitest";
import { checkStability } from "./stability.js";
import { reportCarbonClosure } from "./closure.js";
import { runScenario } from "./index.js";
import type { YearRecord } from "./types.js";

const mk = (over: Partial<YearRecord>): YearRecord => ({
  year: 2100, co2: 600, tempAnomaly: 3, oceanDeep: 1, forcing: 4.5,
  seaLevel: 0.7, slThermal: 0.3, slGlacier: 0.1, slIceSheet: 0.25, slLandWater: 0.05,
  oceanUptake: 3, landSink: 4, biomass: 550, soilMoisture: 800, permafrost: 1300,
  forcingCo2: 4, forcingCh4: 0.6, forcingN2o: 0.25, forcingOther: -0.35,
  oceanHeatUptake: 0.6, seaIceArea: 5, precip: 900, evap: 520, runoff: 380,
  npp: 55, fireAnomaly: 0.1,
  ...over,
});

describe("V02-E05 稳定性检查", () => {
  it("正常记录无告警", () => {
    expect(checkStability([mk({}), mk({ year: 2101, tempAnomaly: 3.05 })])).toEqual([]);
  });
  it("构造异常态逐项告警：NaN / CO₂ 越界 / 冻土为负 / 冰川超储 / 生物量为负", () => {
    expect(checkStability([mk({ co2: NaN })]).length).toBeGreaterThan(0);
    expect(checkStability([mk({ co2: 12000 })]).length).toBeGreaterThan(0);
    expect(checkStability([mk({ permafrost: -5 })]).length).toBeGreaterThan(0);
    expect(checkStability([mk({ slGlacier: 0.5 })]).length).toBeGreaterThan(0);
    expect(checkStability([mk({ biomass: -1 })]).length).toBeGreaterThan(0);
  });
  it("四情景全时域正式运行均无告警，SimResult.warnings 为空", () => {
    for (const id of ["ssp126", "ssp245", "ssp370", "ssp585"] as const) {
      const sim = runScenario(id, 2500);
      expect(sim.warnings, id).toEqual([]);
    }
  });
});

describe("V02-E03 反馈闭合报告", () => {
  it("历史段（排放驱动）守恒闭合：残差 < 1%", () => {
    const rep = reportCarbonClosure("ssp245");
    expect(rep.historical.closed).toBe(true);
    expect(rep.historical.residualRatio).toBeLessThan(1e-2);
    expect(rep.historical.cumEmissions).toBeGreaterThan(600); // 化石+LULUC 1850-2024
    expect(rep.scenarioNote).toContain("外生浓度");
  });
});
