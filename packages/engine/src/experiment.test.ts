import { describe, it, expect } from "vitest";
import { reshapeEmissions, runExperiment, DEFAULT_CONTROLS, ExperimentControlsSchema } from "./experiment.js";
import { crossingYears } from "./thresholds.js";

const YEARS = Array.from({ length: 8 }, (_, i) => 2025 + i * 60); // 2025..2445

describe("V0.3 实验控制 schema", () => {
  it("拒绝越界值与非法组合", () => {
    expect(ExperimentControlsSchema.safeParse({ ...DEFAULT_CONTROLS, emissionScale: 2 }).success).toBe(false);
    expect(ExperimentControlsSchema.safeParse({ ...DEFAULT_CONTROLS, declineStart: 2020 }).success).toBe(false);
    expect(ExperimentControlsSchema.safeParse({ ...DEFAULT_CONTROLS, netZeroYear: 2024 }).success).toBe(false);
    expect(ExperimentControlsSchema.safeParse({ ...DEFAULT_CONTROLS, declineStart: 2100, netZeroYear: 2060 }).success).toBe(false);
    expect(ExperimentControlsSchema.safeParse(DEFAULT_CONTROLS).success).toBe(true);
  });
});

describe("reshapeEmissions（纯函数）", () => {
  it("declineStart 前等于 scale×基准；netZero 年归零；+50 年达 −2 并保持", () => {
    const base = YEARS.map((_, i) => 10 - i);
    const out = reshapeEmissions(YEARS, base, { ...DEFAULT_CONTROLS, declineStart: 2025, netZeroYear: 2085 });
    expect(out[0]).toBeCloseTo(10, 6);
    const i2085 = YEARS.indexOf(2085);
    expect(out[i2085]).toBeCloseTo(0, 6);
    const i2500ish = YEARS.at(-1)!;
    expect(out[YEARS.length - 1]).toBeCloseTo(-2, 6);
    expect(i2500ish).toBeGreaterThan(0);
  });
});

describe("runExperiment（教育性实验）", () => {
  const strong = { ...DEFAULT_CONTROLS, emissionScale: 0.6, declineStart: 2030, netZeroYear: 2050, methanePath: "low" as const, sinkCapacity: "enhanced" as const };
  const weak = { ...DEFAULT_CONTROLS, emissionScale: 1.4, declineStart: 2090, netZeroYear: 2150, methanePath: "high" as const, sinkCapacity: "conservative" as const };

  it("元数据：emissions-driven + 教育性实验置信标注 + controls 回显", () => {
    const sim = runExperiment("ssp245", DEFAULT_CONTROLS, 2100);
    expect(sim.metadata.driverMode).toBe("emissions-driven");
    expect(sim.metadata.confidenceNotes.some((n) => n.label.includes("教育性实验"))).toBe(true);
    expect(sim.experiment?.controls.emissionScale).toBe(1);
    expect(sim.warnings).toEqual([]);
  });
  it("单调性门：强减排 < 默认 < 弱减排（2100 ΔT）", () => {
    const a = runExperiment("ssp245", strong, 2100);
    const b = runExperiment("ssp245", DEFAULT_CONTROLS, 2100);
    const c = runExperiment("ssp245", weak, 2100);
    const at = (s: typeof a) => s.metrics.tempAnomaly[s.years.indexOf(2100)]!;
    expect(at(a)).toBeLessThan(at(b));
    expect(at(b)).toBeLessThan(at(c));
  });
  it("合理性门：默认实验 2100 ΔT ∈ 1.5–4.5°C；2500 < 10°C；稳定性无告警", () => {
    const sim = runExperiment("ssp245", DEFAULT_CONTROLS, 2500);
    const dT2100 = sim.metrics.tempAnomaly[sim.years.indexOf(2100)]!;
    const dT2500 = sim.metrics.tempAnomaly.at(-1)!;
    expect(dT2100).toBeGreaterThan(1.5);
    expect(dT2100).toBeLessThan(4.5);
    expect(dT2500).toBeLessThan(10);
    expect(sim.warnings).toEqual([]);
  });
  it("G7/G8 分量和在实验模式同样成立（舍入容差）", () => {
    const sim = runExperiment("ssp245", DEFAULT_CONTROLS, 2100);
    const dg = sim.metrics.diagnostics!;
    for (let i = 0; i < sim.years.length; i++) {
      const sum = dg.forcing.co2[i]! + dg.forcing.ch4[i]! + dg.forcing.n2o[i]! + dg.forcing.other[i]!;
      expect(Math.abs(sum - dg.forcing.total[i]!)).toBeLessThan(0.01);
    }
  });
  it("逐位确定性", () => {
    expect(JSON.stringify(runExperiment("ssp585", strong, 2100))).toBe(JSON.stringify(runExperiment("ssp585", strong, 2100)));
  });
});

describe("crossingYears", () => {
  it("单调且未达标为 undefined", () => {
    const cy = crossingYears([2000, 2050, 2100], [1.0, 1.7, 2.4]);
    expect(cy.t15).toBe(2050);
    expect(cy.t20).toBe(2100);
    expect(cy.t30).toBeUndefined();
    const cy2 = crossingYears([2000], [3.5]);
    expect(cy2.t30).toBe(2000);
    expect(cy2.t15).toBe(2000);
  });
});
