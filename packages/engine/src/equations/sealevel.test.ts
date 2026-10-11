import { describe, it, expect } from "vitest";
import type { Params } from "../types.js";
import { dSth, dSglacier, dSgris, dSais, seaLevelSum, seaLevelRate } from "./sealevel.js";
const p = {
  lambda: 1.16, gamma_ocean: 0.73, c_s: 8.2, c_d: 105, k_thermal: 0.0045,
  k_glacier: 0.0005, amp_glacier: 1.5, g0_glacier: 0.4,
  b0_gris: 0.0002, b1_gris: 0.001, b2_gris: 0.0002, amp_gris: 2.0,
  c0_ais: 0.0001, c1_ais: 0.0002, lw_rate: 0.0003,
} as Params;
const s = { co2: 422, ts: 1.4, td: 0.8, sThermal: 0.1, sGlacier: 0.1, sGrIS: 0.02, sAIS: 0.015, sLandWater: 0.005, b: 550, w: 800, mPf: 1400, pTh: 0 };

describe("海平面方程", () => {
  it("eq_14: 表层暖于深层 → 热膨胀为正", () => {
    expect(dSth(1.4, 0.8, p)).toBeGreaterThan(0);
    expect(dSth(0.8, 1.4, p)).toBeLessThan(0);
  });
  it("eq_26: 冰川储量耗尽后速率归零（长期积分不超过 G0）", () => {
    let sg = 0;
    for (let i = 0; i < 10000; i++) sg += dSglacier(4, sg, p);
    expect(sg).toBeLessThanOrEqual(p.g0_glacier + 1e-9);
  });
  it("eq_27: 冰盖损失随温度单调加速", () => {
    expect(dSgris(2, p)).toBeGreaterThan(dSgris(1, p));
    expect(dSais(2, p)).toBeGreaterThan(dSais(1, p));
    expect(dSgris(1, p) + dSais(1, p)).toBeGreaterThan(0);
  });
  it("eq_31/32: 加总一致", () => {
    expect(seaLevelSum(s)).toBeCloseTo(0.24, 6);
    expect(seaLevelRate(s, p)).toBeGreaterThan(0);
  });
});
