import { describe, it, expect } from "vitest";
import { loadTemperature, loadCO2, loadEmissions } from "./loaders.js";

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
});
