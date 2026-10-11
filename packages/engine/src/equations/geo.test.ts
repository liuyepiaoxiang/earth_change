import { describe, it, expect } from "vitest";
import {
  slope, riverErosion, surfaceErosion, vegetationShield,
  sedimentBudget, sedimentTransport, elevationChange, coastalErosion,
} from "./geo.js";

describe("eq_41–48 地貌演化诊断（v3）", () => {
  it("eq_41 坡度 = |ΔZ|/Δx；dx≤0 抛错", () => {
    expect(slope(10, 1000)).toBeCloseTo(0.01, 9);
    expect(slope(-10, 1000)).toBeCloseTo(0.01, 9); // 绝对值
    expect(() => slope(1, 0)).toThrow();
  });

  it("eq_42 河流侵蚀：基准（q=1, s=1）= k；随径流/坡度幂律增长；负输入 0", () => {
    expect(riverErosion(1, 1)).toBeCloseTo(0.05, 9);
    expect(riverErosion(2, 1)).toBeCloseTo(0.05 * 2 ** 1.6, 9);
    expect(riverErosion(-1, 1)).toBe(0);
  });

  it("eq_43 地表侵蚀线性；负径流 0", () => {
    expect(surfaceErosion(1)).toBeCloseTo(0.1, 9);
    expect(surfaceErosion(1.2)).toBeCloseTo(0.12, 9);
    expect(surfaceErosion(-1)).toBe(0);
  });

  it("eq_44 植被护土：裸地全额、全植被抑制 80%、过覆盖钳制", () => {
    expect(vegetationShield(0.1, 0)).toBeCloseTo(0.1, 9);
    expect(vegetationShield(0.1, 1)).toBeCloseTo(0.02, 9);
    expect(vegetationShield(0.1, 1.5)).toBeCloseTo(0.02, 9); // V 钳 1
  });

  it("eq_45 沉积收支：输入−输出（正=净沉积）", () => {
    expect(sedimentBudget(5, 3)).toBe(2);
    expect(sedimentBudget(3, 5)).toBe(-2);
  });

  it("eq_46 输沙与 eq_42 同构独立标定", () => {
    expect(sedimentTransport(1, 1)).toBeCloseTo(0.03, 9);
    expect(sedimentTransport(2, 1)).toBeCloseTo(0.03 * 2 ** 1.5, 9);
  });

  it("eq_47 高程变化 = 沉积 − 侵蚀", () => {
    expect(elevationChange(0.02, 0.05)).toBeCloseTo(-0.03, 9);
  });

  it("eq_48 海岸侵蚀：随 SLR 增长、冷端 0、Brunn 量级（SLR 1m → 0.15 m/yr）", () => {
    expect(coastalErosion(0)).toBe(0);
    expect(coastalErosion(1)).toBeCloseTo(0.15, 9);
    expect(coastalErosion(9)).toBeGreaterThan(coastalErosion(1));
  });
});
