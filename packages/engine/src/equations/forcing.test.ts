import { describe, it, expect } from "vitest";
import type { Params } from "../types.js";
import { fCO2, fGHG, fTotal } from "./forcing.js";

const p = { c0_ref: 280, a_ch4: 0.036, a_n2o: 0.12, ch4_ref: 722, n2o_ref: 273  } as Params;

describe("辐射强迫方程", () => {
  it("eq_07: CO₂ 倍增 → 5.35·ln2 ≈ 3.708 W/m²", () => {
    expect(fCO2(560, p)).toBeCloseTo(3.708, 2);
  });
  it("eq_07: 工业前浓度 → 0", () => {
    expect(fCO2(280, p)).toBeCloseTo(0, 6);
  });
  it("eq_08: 2024 现状 GHG 总强迫在 2.8~3.2 W/m²", () => {
    expect(fGHG(422, 1930, 337, p)).toBeGreaterThan(2.8);
    expect(fGHG(422, 1930, 337, p)).toBeLessThan(3.2);
  });
  it("eq_09: 其他强迫为负时总强迫相应降低", () => {
    expect(fTotal(422, 1930, 337, -0.75, p)).toBeCloseTo(fGHG(422, 1930, 337, p) - 0.75, 6);
  });
});
