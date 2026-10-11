import { describe, it, expect } from "vitest";
import { fireProbability, fireFlux } from "./fire.js";

describe("eq_37 火灾概率（logistic 诊断）", () => {
  it("基线（无异常）概率 0.5 以下、暖化+干旱单调增", () => {
    expect(fireProbability(0, 0)).toBeCloseTo(0.5, 9);
    expect(fireProbability(2, 20)).toBeGreaterThan(fireProbability(0, 0));
    expect(fireProbability(4, 60)).toBeGreaterThan(fireProbability(2, 20));
  });

  it("值域钳制 [0, 1]", () => {
    expect(fireProbability(10, 100)).toBeGreaterThan(0.85); // logistic 渐近饱和
    expect(fireProbability(-10, 0)).toBeGreaterThanOrEqual(0);
  });

  it("植被覆盖 V 缩放（无植被无火灾）", () => {
    expect(fireProbability(4, 60, 0)).toBe(0);
    expect(fireProbability(4, 60, 0.5)).toBeCloseTo(fireProbability(4, 60) * 0.5, 9);
  });
});

describe("eq_38 火灾损失通量（气候异常口径）", () => {
  it("与概率、ΔT、覆盖线性联动；冷端 0", () => {
    expect(fireFlux(0.8, 3, 1, 0.3)).toBeCloseTo(0.8 * 0.3 * 3, 9);
    expect(fireFlux(0.8, -2, 1, 0.3)).toBe(0); // 冷异常无火灾增加
    expect(fireFlux(0.8, 3, 0, 0.3)).toBe(0);
  });

  it("fireK 扰动线性（MC 扩展点）", () => {
    expect(fireFlux(0.5, 4, 1, 0.6)).toBeCloseTo(2 * fireFlux(0.5, 4, 1, 0.3), 9);
  });
});
