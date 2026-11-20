import { describe, it, expect } from "vitest";
import { makeRound, gradeDiff, POINTS, tempQuestion } from "./guess-core";
import type { SimResultWithUnc } from "./sim";

/** 最小 sim 桩（years 覆盖 2030–2150 候选年） */
function fakeSim(anomaly2100 = 2.8): SimResultWithUnc {
  const years = Array.from({ length: 122 }, (_, i) => 2029 + i); // 2029..2150
  const tempAnomaly = years.map((y) => (y === 2100 ? anomaly2100 : (y - 2029) * 0.02));
  return {
    scenario: "ssp245",
    years,
    metrics: { tempAnomaly, seaLevel: { total: [], thermal: [], glacier: [], iceSheet: [], landWater: [] }, co2: [] },
  } as unknown as SimResultWithUnc;
}

describe("guess-core（A1/A2 共用核心）", () => {
  it("makeRound：目标年取自候选集合、ΔT 来自该年真实序列、scenario 取 sim 真实值（修复原随机 bug）", () => {
    const sim = fakeSim();
    for (let k = 0; k < 30; k++) {
      const r = makeRound(sim, "zh");
      expect([2030, 2040, 2050, 2060, 2075, 2090, 2100, 2120, 2150]).toContain(r.targetYear);
      const i = sim.years.indexOf(r.targetYear);
      expect(r.targetDT).toBe(sim.metrics.tempAnomaly[i]);
      expect(r.scenario).toBe("ssp245"); // 不再随机
    }
  });

  it("gradeDiff：分档边界（<0.1/<0.3/<0.6/<1.5/其余）", () => {
    expect(gradeDiff(0.09)).toBe(0);
    expect(gradeDiff(0.1)).toBe(1);
    expect(gradeDiff(0.29)).toBe(1);
    expect(gradeDiff(0.59)).toBe(2);
    expect(gradeDiff(1.49)).toBe(3);
    expect(gradeDiff(1.5)).toBe(4);
    expect(POINTS).toEqual([100, 70, 40, 15, 0]);
  });

  it("tempQuestion：2100 年题面取真实 ΔT，定义域 [0,6]", () => {
    const q = tempQuestion(fakeSim(2.8), 2100);
    expect(q.year).toBe(2100);
    expect(q.actualDT).toBeCloseTo(2.8, 9);
    expect(q.min).toBe(0);
    expect(q.max).toBe(6);
  });
});
