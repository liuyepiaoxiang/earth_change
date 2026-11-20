import { describe, it, expect } from "vitest";
import { localDTs, scaledPrecip, isCityFlooded, classifyBiome, patternAmp, urbanHeatIsland } from "./downscale.js";

describe("降尺度方程", () => {
  it("eq_51: 北极放大、赤道衰减", () => {
    expect(localDTs(2, 80)).toBeCloseTo(5.6, 6);
    expect(localDTs(2, 0)).toBeCloseTo(1.7, 6);
    expect(patternAmp(80)).toBeGreaterThan(patternAmp(0));
  });
  it("eq_52: 降水随全球升温增加 2%/°C", () => {
    expect(scaledPrecip(1000, 2)).toBeCloseTo(1040, 6);
  });
  it("eq_53: 淹没判定边界", () => {
    expect(isCityFlooded(5, 0.6)).toBe(false);
    expect(isCityFlooded(0.5, 0.6)).toBe(true);
    expect(isCityFlooded(0.6, 0.6)).toBe(true);
  });
  it("eq_50: 群系查表", () => {
    expect(classifyBiome(-25, 100)).toBe("冰雪");
    expect(classifyBiome(-5, 300)).toBe("苔原");
    expect(classifyBiome(3, 600)).toBe("针叶林");
    expect(classifyBiome(10, 800)).toBe("温带森林");
    expect(classifyBiome(28, 100)).toBe("荒漠");
    expect(classifyBiome(27, 2000)).toBe("热带森林");
  });
});

describe("eq_54: 城市热岛（v4 诊断式）", () => {
  it("量级与锚点：1 万 ≈0.5 / 百万 ≈1.6 / 三千万 ≈2.2（docs/09 §2.1 规定 0.5–3°C）", () => {
    expect(urbanHeatIsland(1e4)).toBeCloseTo(0.5, 6);
    expect(urbanHeatIsland(1e6)).toBeCloseTo(1.6, 6);
    expect(urbanHeatIsland(3e7)).toBeCloseTo(0.55 * Math.log10(3e3) + 0.5, 9);
    expect(urbanHeatIsland(3e7)).toBeGreaterThan(2.1);
    expect(urbanHeatIsland(3e7)).toBeLessThan(3);
  });
  it("单调性 + 钳制：人口越大热岛越强，上界 3 / 下界 0", () => {
    let prev = -1;
    for (const pop of [5e3, 5e4, 5e5, 5e6, 5e7, 5e8, 1e9]) {
      const u = urbanHeatIsland(pop);
      expect(u).toBeGreaterThanOrEqual(prev);
      expect(u).toBeLessThanOrEqual(3);
      prev = u;
    }
    expect(urbanHeatIsland(1e10)).toBe(3); // 钳上界
    expect(urbanHeatIsland(0)).toBe(0); // 非城市
    expect(urbanHeatIsland(-5)).toBe(0); // 病态输入守卫
  });
});
