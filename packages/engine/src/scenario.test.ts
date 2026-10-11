import { describe, it, expect } from "vitest";
import { makeHistoricalDrivers, makeScenarioDrivers, initialState } from "./scenario.js";

describe("历史驱动（1850-2024）", () => {
  const dh = makeHistoricalDrivers();

  it("数据年份内取精确值（1850/2024 无插值误差）", () => {
    for (const y of [1850, 1900, 2024]) {
      const d = dh(y);
      expect(d.year).toBe(y);
      expect(Number.isFinite(d.efossil)).toBe(true);
      expect(Number.isFinite(d.eluluc)).toBe(true);
      expect(Number.isFinite(d.ch4)).toBe(true);
      expect(Number.isFinite(d.n2o)).toBe(true);
      expect(Number.isFinite(d.fOther)).toBe(true);
    }
  });

  it("排放非负且现代年份量级合理（2024 化石排放 > 5 GtC/yr）", () => {
    expect(dh(2024).efossil).toBeGreaterThan(5);
    expect(dh(1850).efossil).toBeGreaterThanOrEqual(0);
  });

  it("区间外钳制到端点（1700 低于排放起点取首值、2050 超出强迫终点取末值）", () => {
    // 排放数据自 1750 起，1700 早于起点 → 钳制到 1750 值
    expect(dh(1700).efossil).toBe(dh(1750).efossil);
    // 强迫数据止于 2024 → 2050 钳制到 2024 值
    expect(dh(2050).ch4).toBe(dh(2024).ch4);
  });

  it("半年插值取相邻两年均值", () => {
    const a = dh(1900).efossil;
    const b = dh(1901).efossil;
    expect(dh(1900.5).efossil).toBeCloseTo((a + b) / 2, 10);
  });
});

describe("情景驱动（2025-2500，浓度驱动）", () => {
  const ids = ["ssp126", "ssp245", "ssp370", "ssp585"] as const;

  it.each(ids)("四个情景均有驱动序列且 prescribedCo2 端点有限（%s）", (id) => {
    const ds = makeScenarioDrivers(id);
    const first = ds(2025);
    const last = ds(2500);
    expect(first.prescribedCo2).toBeGreaterThan(280); // 高于工业化前
    // 注意：ssp126 为减排情景，2500 年浓度可低于 2025（净负排放），不作单调假设
    expect(last.prescribedCo2).toBeGreaterThan(300);
    expect(Number.isFinite(last.prescribedCo2)).toBe(true);
    expect(Number.isFinite(first.fOther)).toBe(true);
  });

  it("ssp245 中点插值介于两端之间", () => {
    const ds = makeScenarioDrivers("ssp245");
    const a = ds(2100).prescribedCo2!;
    const b = ds(2102).prescribedCo2!;
    const mid = ds(2101).prescribedCo2!;
    expect(mid).toBeGreaterThanOrEqual(Math.min(a, b) - 1e-9);
    expect(mid).toBeLessThanOrEqual(Math.max(a, b) + 1e-9);
  });

  it("区间外钳制（2024 取首值、2501 取末值）", () => {
    const ds = makeScenarioDrivers("ssp585");
    expect(ds(2024).prescribedCo2).toBe(ds(2025).prescribedCo2);
    expect(ds(2501).efossil).toBe(ds(2500).efossil);
  });

  it("未知情景抛错", () => {
    expect(() => makeScenarioDrivers("rcp85" as "ssp585")).toThrow(/情景不存在/);
  });
});

describe("初始状态（1850）", () => {
  it("默认 CO₂ 取冰芯值，温度与海平面各项归零", () => {
    const s = initialState();
    expect(s.co2).toBeCloseTo(285.2, 6);
    expect(s.ts).toBe(0);
    expect(s.td).toBe(0);
    expect(s.sThermal).toBe(0);
    expect(s.sGlacier).toBe(0);
    expect(s.sGrIS).toBe(0);
    expect(s.sAIS).toBe(0);
    expect(s.sLandWater).toBe(0);
  });

  it("支持自定义 1850 CO₂ 锚点", () => {
    expect(initialState(280).co2).toBe(280);
  });
});
