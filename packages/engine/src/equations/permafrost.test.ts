import { describe, it, expect } from "vitest";
import { permafrostThaw, permafrostRelease } from "./permafrost.js";

describe("eq_39 冻土融化（阈值 + 线性速率）", () => {
  it("低于阈值无融化；超阈值线性增长", () => {
    expect(permafrostThaw(1400, 0.5)).toBe(0); // ΔT < T_pf
    expect(permafrostThaw(1400, 1.0)).toBe(0); // 阈值处
    expect(permafrostThaw(1400, 3.0)).toBe(-60); // k_pf×(3−1) = 60
    expect(permafrostThaw(1400, 8.0)).toBe(-210);
  });

  it("库不穿底：融化速率受剩余库钳制", () => {
    expect(permafrostThaw(50, 8.0)).toBe(-50); // 想融 210 但只剩 50
  });
});

describe("eq_40 冻土碳释放", () => {
  it("释放 = 已融池 × 年释放比", () => {
    expect(permafrostRelease(100, 0.02)).toBeCloseTo(2, 9);
    expect(permafrostRelease(0, 0.02)).toBe(0);
  });

  it("r_pf 扰动线性（MC 扩展点）", () => {
    expect(permafrostRelease(100, 0.04)).toBeCloseTo(2 * permafrostRelease(100, 0.02), 9);
  });
});
