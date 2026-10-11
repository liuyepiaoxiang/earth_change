import { describe, it, expect } from "vitest";
import { loadTemperature, loadCO2, loadEmissions, loadCities, loadWarmingPattern } from "./loaders.js";

describe("数据加载", () => {
  it("温度：1880-2024 无年份缺口（GISTEMP 起始年）", () => {
    const t = loadTemperature();
    expect(t[0]!.year).toBe(1880);
    expect(t.at(-1)!.year).toBe(2024);
    for (let i = 1; i < t.length; i++) expect(t[i]!.year - t[i - 1]!.year).toBe(1);
  });
  it("CO₂：总体上升、2024 在 415-430ppm", () => {
    const c = loadCO2();
    for (let i = 1; i < c.length; i++) expect(c[i]!.ppm).toBeGreaterThan(c[i - 1]!.ppm - 0.5);
    expect(c.at(-1)!.ppm).toBeGreaterThan(415);
    expect(c.at(-1)!.ppm).toBeLessThan(430);
  });
  it("排放：1750-2024 连续且非负", () => {
    const e = loadEmissions();
    expect(e[0]!.year).toBe(1750);
    expect(e).toHaveLength(275);
    for (const r of e) expect(r.efossil).toBeGreaterThanOrEqual(0);
  });
  it("城市：行数 300-600、字段范围合理", () => {
    const c = loadCities();
    expect(c.length).toBeGreaterThanOrEqual(300);
    expect(c.length).toBeLessThanOrEqual(600);
    for (const r of c) {
      expect(Math.abs(r.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(r.lon)).toBeLessThanOrEqual(180);
      expect(r.elevation).toBeGreaterThanOrEqual(-10);
      expect(r.population).toBeGreaterThan(0);
      expect(r.tbase).toBeGreaterThan(-30);
      expect(r.tbase).toBeLessThan(40);
      expect(r.pbase).toBeGreaterThanOrEqual(0);
    }
  });
  it("纬度带升温模式：7-9 带、amp 0.2-4（南半球海洋带可低于 0.5）、带区间不重叠", () => {
    const p = loadWarmingPattern();
    expect(p.length).toBeGreaterThanOrEqual(7);
    expect(p.length).toBeLessThanOrEqual(9);
    for (const b of p) {
      expect(b.latMin).toBeLessThan(b.latMax);
      expect(b.amp).toBeGreaterThanOrEqual(0.2);
      expect(b.amp).toBeLessThanOrEqual(4);
    }
  });
});
