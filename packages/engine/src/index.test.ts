import { describe, it, expect } from "vitest";
import { runScenario } from "./index.js";

describe("公开 API runScenario（SimResult 契约）", () => {
  const sim = runScenario("ssp245", 2100);

  it("版本化字段齐全：schemaVersion/modelVersion/scenario/paramsFingerprint", () => {
    expect(sim.schemaVersion).toBe(2);
    expect(sim.modelVersion).toBe("2.0.0");
    expect(sim.scenario).toBe("ssp245");
    expect(sim.paramsFingerprint).toMatch(/^sha256:[0-9a-f]{16}$/);
  });

  it("年份连续覆盖 1851-2100、逐年步长 1", () => {
    expect(sim.years[0]).toBe(1851);
    expect(sim.years.at(-1)).toBe(2100);
    for (let i = 1; i < sim.years.length; i++) expect(sim.years[i]! - sim.years[i - 1]!).toBe(1);
  });

  it("metrics 各序列与年份等长且有限", () => {
    const n = sim.years.length;
    expect(sim.metrics.tempAnomaly).toHaveLength(n);
    expect(sim.metrics.co2).toHaveLength(n);
    expect(sim.metrics.seaLevel.total).toHaveLength(n);
    for (const v of sim.metrics.tempAnomaly) expect(Number.isFinite(v)).toBe(true);
    for (const v of sim.metrics.co2) expect(Number.isFinite(v)).toBe(true);
  });

  it("海平面四分量之和 ≈ 总量（舍入容差内）", () => {
    const sl = sim.metrics.seaLevel;
    for (let i = 0; i < sim.years.length; i++) {
      const sum = sl.thermal[i]! + sl.glacier[i]! + sl.iceSheet[i]! + sl.landWater[i]!;
      expect(sum).toBeCloseTo(sl.total[i]!, 2);
    }
  });

  it("历史/情景拼接连续：不同 horizon 的公共前缀逐位一致", () => {
    const short = runScenario("ssp245", 2030).metrics.tempAnomaly;
    const long = runScenario("ssp245", 2500).metrics.tempAnomaly;
    for (let i = 0; i < short.length; i++) expect(long[i]).toBe(short[i]);
  });

  it("默认 horizon 为 2500", () => {
    expect(runScenario("ssp126").years.at(-1)).toBe(2500);
  });

  it("温度异常单调性：ssp585 2100 年升温高于 2050 年", () => {
    const s = runScenario("ssp585", 2100);
    const at = (y: number) => s.metrics.tempAnomaly[s.years.indexOf(y)]!;
    expect(at(2100)).toBeGreaterThan(at(2050));
  });

  it("非法情景抛错", () => {
    expect(() => runScenario("rcp45" as "ssp245")).toThrow();
  });
});

describe("v0.2 契约：metadata 与 G9 逐位复现", () => {
  const a = runScenario("ssp245", 2100);
  it("metadata 完整：modelScope/driverMode/driverSegments/confidenceNotes/dataManifestHash", () => {
    expect(a.metadata.modelScope).toBe("global-box");
    expect(a.metadata.driverMode).toBe("hybrid");
    expect(a.metadata.driverSegments).toHaveLength(2);
    expect(a.metadata.driverSegments[0]!.mode).toBe("emissions-driven");
    expect(a.metadata.driverSegments[1]!.mode).toBe("concentration-driven");
    expect(a.metadata.confidenceNotes.length).toBeGreaterThanOrEqual(3);
    expect(a.metadata.confidenceNotes.some((n) => n.from === 2101 && n.label.includes("探索性外推"))).toBe(true);
    expect(a.metadata.dataManifestHash).toMatch(/^[0-9a-f]{16}$/);
  });
  it("G9：同 fingerprint + manifest + 情景 → 逐位一致", () => {
    const b = runScenario("ssp245", 2100);
    expect(a.paramsFingerprint).toBe(b.paramsFingerprint);
    expect(a.metadata.dataManifestHash).toBe(b.metadata.dataManifestHash);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
