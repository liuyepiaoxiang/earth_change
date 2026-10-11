import { describe, it, expect } from "vitest";
import type { Params } from "../types.js";
import { dTs, dTd, heatContent } from "./ocean.js";
const p = { lambda: 1.16, gamma_ocean: 0.73, c_s: 8.2, c_d: 105  } as Params;

describe("两层 EBM", () => {
  it("eq_11: 零异常零强迫 → 零变率；纯强迫 → F/Cs", () => {
    expect(dTs(0, 0, 0, p)).toBe(0);
    expect(dTs(3.71, 0, 0, p)).toBeCloseTo(3.71 / 8.2, 6);
  });
  it("eq_11/eq_06: 深海恒温下平衡温度 = F/λ（ECS=F2x/λ）", () => {
    const F2x = 5.35 * Math.log(2);
    expect(F2x / p.lambda).toBeCloseTo(3.2, 1);
  });
  it("eq_12: 深层跟随表层、符号正确", () => {
    expect(dTd(1, 0, p)).toBeCloseTo(0.73 / 105, 6);
    expect(dTd(0, 1, p)).toBeLessThan(0);
  });
  it("eq_13: 热含量加和", () => {
    expect(heatContent(1, 2, p)).toBeCloseTo(8.2 + 210, 6);
  });
});
