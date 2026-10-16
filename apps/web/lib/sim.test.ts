import { describe, it, expect } from "vitest";
import { metricsAt } from "./sim";
import type { SimResult } from "@future-earth/engine";

function fakeSim(years: number[], temp: number[], total: number[]): SimResult {
  return {
    schemaVersion: 2,
    modelVersion: "0.1.0",
    scenario: "ssp245",
    paramsFingerprint: "sha256:test",
    metadata: {
      modelScope: "global-box",
      driverMode: "hybrid",
      driverSegments: [{ from: 1850, to: 2024, mode: "emissions-driven" }, { from: 2025, mode: "concentration-driven" }],
      confidenceNotes: [],
      dataManifestHash: "test",
    },
    warnings: [],
    years,
    metrics: {
      tempAnomaly: temp,
      co2: years.map((_, i) => 400 + i),
      seaLevel: {
        total,
        thermal: total.map((v) => v * 0.3),
        glacier: total.map((v) => v * 0.2),
        iceSheet: total.map((v) => v * 0.4),
        landWater: total.map((v) => v * 0.1),
      },
    },
  };
}

describe("metricsAt 年份插值", () => {
  const sim = fakeSim([2026, 2028, 2030], [1.0, 2.0, 3.0], [0.1, 0.3, 0.5]);

  it("区间中点线性插值", () => {
    const s = metricsAt(sim, 2027)!;
    expect(s.tempAnomaly).toBeCloseTo(1.5);
    expect(s.seaLevel.total).toBeCloseTo(0.2);
    expect(s.seaLevel.iceSheet).toBeCloseTo(0.2 * 0.4);
    expect(s.year).toBe(2027);
  });

  it("非整数年份按比例插值", () => {
    expect(metricsAt(sim, 2029.5)!.tempAnomaly).toBeCloseTo(2.75);
  });

  it("越界钳制到端点", () => {
    expect(metricsAt(sim, 1900)!.year).toBe(2026);
    expect(metricsAt(sim, 1900)!.tempAnomaly).toBe(1.0);
    expect(metricsAt(sim, 2600)!.year).toBe(2030);
    expect(metricsAt(sim, 2600)!.tempAnomaly).toBe(3.0);
  });

  it("命中端点年份", () => {
    expect(metricsAt(sim, 2028)!.tempAnomaly).toBe(2.0);
  });

  it("空序列返回 null", () => {
    expect(metricsAt(fakeSim([], [], []), 2026)).toBeNull();
  });
});
