import { describe, it, expect } from "vitest";
import { localDTs, scaledPrecip, isCityFlooded, classifyBiome, patternAmp } from "./downscale.js";

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
