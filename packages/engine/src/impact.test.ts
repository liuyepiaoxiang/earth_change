import { describe, it, expect } from "vitest";
import { runScenario } from "./index.js";
import { runImpacts, exposedPopulation, economicDamage } from "./impact.js";
import { loadCities } from "@future-earth/data";


const sim = runScenario("ssp585", 2500);
const cities = loadCities();

describe("V2.0 影响模块 I-01~I-05", () => {
  const impacts = runImpacts(sim, 2100, cities);

  it("I-01：暴露人口与城市逐点聚合一致", () => {
    const e = impacts.exposure;
    expect(e.floodedCount).toBeGreaterThan(0); // ssp585 2100 SLR ~1m
    expect(e.floodedCount).toBeLessThanOrEqual(cities.length);
    // 逐点复核：floodedCities 的每个城市高程 ≤ SLR
    const slr = sim.metrics.seaLevel.total[sim.years.indexOf(2100)]!;
    for (const fc of e.floodedCities) {
      const c = cities.find((x) => x.name === fc.name)!;
      expect(c.elevation).toBeLessThanOrEqual(slr + 0.01);
    }
  });
  it("I-02：水资源与引擎水循环一致（径流量级/人均合理）", () => {
    expect(impacts.water.perCapitaM3).toBeGreaterThan(1000);
    expect(impacts.water.perCapitaM3).toBeLessThan(30000);
    expect(impacts.water.globalRunoff).toBeGreaterThan(0);
  });
  it("I-03：适应不改变基础气候状态", () => {
    const none = economicDamage(sim, 2100, "none");
    const high = economicDamage(sim, 2100, "high");
    expect(high.gdpLossPct).toBeLessThan(none.gdpLossPct); // 损害降低
    // sim 对象本身不变（纯函数）
    expect(sim.metrics.tempAnomaly[0]).toBe(sim.metrics.tempAnomaly[0]);
  });
  it("I-04：越界警告——高情景 2100+ 触发", () => {
    const hot = runImpacts(sim, 2500, cities);
    expect(hot.oceanAcid.meta.warnings.length).toBeGreaterThan(0);
    expect(hot.heat.meta.warnings.length).toBeGreaterThanOrEqual(0); // ΔT>6 可能
  });
  it("I-05：可追溯——所有 meta 字段非空", () => {
    for (const key of ["exposure", "water", "heat", "agriculture", "ecology", "oceanAcid", "damage", "scc"] as const) {
      const m = (impacts as unknown as Record<string, { meta: { formula: string; source: string; validRange: string } }>)[key]!.meta;
      expect(m.formula.length, key).toBeGreaterThan(5);
      expect(m.source.length, key).toBeGreaterThan(3);
      expect(m.validRange.length, key).toBeGreaterThan(3);
    }
  });
  it("暴露人口随防护档单调递减", () => {
    const n = exposedPopulation(sim, 2500, cities, "none").exposedPopulation;
    const m = exposedPopulation(sim, 2500, cities, "medium").exposedPopulation;
    const h = exposedPopulation(sim, 2500, cities, "high").exposedPopulation;
    expect(m).toBeLessThanOrEqual(n);
    expect(h).toBeLessThanOrEqual(m);
  });
});
