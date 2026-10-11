import { describe, it, expect } from "vitest";
import type { Params } from "../types.js";
import { landSink, oceanSink, dCO2ppm } from "./carbon.js";

const p = { beta_land: 8.8, k_ocean: 0.02, chi_temp: 0.1, c0_ref: 280, ppm_per_gtc: 0.4708  } as Params;
const d = { year: 2024, efossil: 10.5, eluluc: 1.2, ch4: 1930, n2o: 337, fOther: -0.75 };

describe("碳循环方程", () => {
  it("eq_16: 工业前陆地汇为 0；当前约 3~4 GtC/yr", () => {
    expect(landSink(280, p)).toBe(0);
    expect(landSink(422, p)).toBeGreaterThan(3);
    expect(landSink(422, p)).toBeLessThan(4);
  });
  it("eq_17: 当前海洋汇约 2~3.5 GtC/yr，升温抑制吸收", () => {
    expect(oceanSink(422, 0, p)).toBeGreaterThan(2.5);
    expect(oceanSink(422, 1.4, p)).toBeLessThan(oceanSink(422, 0, p));
  });
  it("eq_15: 现状排放下 CO₂ 年增约 2~3 ppm", () => {
    const r = dCO2ppm(422, 1.4, d, p);
    expect(r).toBeGreaterThan(2);
    expect(r).toBeLessThan(3);
  });
});
