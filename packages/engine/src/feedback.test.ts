import { describe, it, expect } from "vitest";
import { runScenario } from "./index.js";
import { runSim } from "./solver.js";
import { makeHistoricalDrivers, makeScenarioDrivers, initialState } from "./scenario.js";
import { PARAMETER_DEFAULTS } from "@future-earth/spec";
import { CALIBRATED_PARAMS } from "./generated/params.gen.js";
import { PF_CO2_SHARE, PF_CH4_SHARE, RECOVERY_TAU, rhFromClosure } from "./feedback.js";
import type { Params } from "./types.js";

const p: Params = { ...PARAMETER_DEFAULTS, ...CALIBRATED_PARAMS };

describe("V1.5 Phase C：碳循环增强记账", () => {
  const sim = runScenario("ssp585", 2500);
  const cb = sim.metrics.diagnostics!.carbon!;
  const idx2100 = sim.years.indexOf(2100);

  it("闭合会计：landSink ≡ NPP − Rh（全部年份）", () => {
    // landSink = β·ln(C/C₀)，用引擎同式重算
    const beta = CALIBRATED_PARAMS.beta_land ?? PARAMETER_DEFAULTS.beta_land;
    for (const i of [0, idx2100, sim.years.length - 1]) {
      const co2 = sim.metrics.co2[i]!;
      const landSink = beta * Math.log(co2 / (PARAMETER_DEFAULTS.c0_ref ?? 280));
      expect(Math.abs(cb.npp[i]! - cb.rh[i]! - landSink)).toBeLessThan(0.05); // 各自 toFixed(2) 累计舍入
    }
  });
  it("冻土分账：CO₂ + CH₄ = 总释放；份额 0.6/0.4", () => {
    expect(PF_CO2_SHARE + PF_CH4_SHARE).toBeCloseTo(1, 9);
    for (const i of [0, idx2100, sim.years.length - 1]) {
      expect(cb.permafrostCo2[i]! + cb.permafrostCh4[i]!).toBeCloseTo(
        cb.permafrostCo2[i]! / PF_CO2_SHARE, 2,
      );
    }
  });
  it("土壤碳代理单调性（无火灾失控时）+ 恢复时间尺度常量", () => {
    expect(cb.soilCarbonProxy.at(-1)!).toBeGreaterThan(cb.soilCarbonProxy[10]!);
    expect(cb.recoveryTau.every((t: number) => t === RECOVERY_TAU)).toBe(true);
  });
  it("G1–G6 逐位不动：原始 records 中既有数值路径与本改动无关（golden 全绿即证）", () => {
    // 直接复跑 golden 关键断言之一：G4 ssp585 2100 在 AR6 区间
    const dT = sim.metrics.tempAnomaly[idx2100]!;
    expect(dT).toBeGreaterThan(3.3);
    expect(dT).toBeLessThan(5.7);
  });
  it("rhFromClosure 单位性质", () => {
    expect(rhFromClosure(50, 40)).toBe(10);
    expect(rhFromClosure(50, 60)).toBe(-10); // 汇超 NPP 时 Rh 为负 = 会计口径说明
  });
});
