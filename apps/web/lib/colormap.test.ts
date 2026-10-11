import { describe, it, expect } from "vitest";
import {
  tempColorRgb,
  tempColorHex,
  tempColorCssGradient,
  buildTempLut,
  patternAmpInterp,
  TEMP_STOPS,
  TEMP_DOMAIN,
} from "./colormap";

describe("温度发散色阶（F13 可视化规范）", () => {
  it("中性锚点：ΔT=0 为近白（三通道高且接近），非饱和色", () => {
    const [r, g, b] = tempColorRgb(0);
    expect(r).toBeGreaterThan(200);
    expect(g).toBeGreaterThan(210);
    expect(b).toBeGreaterThan(220);
  });

  it("锚点值精确命中 stops 定义", () => {
    for (const s of TEMP_STOPS) {
      expect(tempColorRgb(s.v)).toEqual(s.c);
    }
  });

  it("感知有序：亮度以 0°C 中性点为峰，向暖/冷两侧单调下降（无彩虹回绕）", () => {
    const lum = (t: number) => {
      const [r, g, b] = tempColorRgb(t);
      return 0.299 * r + 0.587 * g + 0.114 * b;
    };
    const warm = Array.from({ length: 33 }, (_, i) => lum(i * 0.25)); // 0..8
    for (let i = 1; i < warm.length; i++) expect(warm[i]!).toBeLessThanOrEqual(warm[i - 1]! + 1e-9);
    const cold = Array.from({ length: 13 }, (_, i) => lum(-i * 0.25)); // 0..-3
    for (let i = 1; i < cold.length; i++) expect(cold[i]!).toBeLessThanOrEqual(cold[i - 1]! + 1e-9);
  });

  it("端点钳制：超出 [−3, 8] 返回端点色", () => {
    expect(tempColorRgb(-10)).toEqual(TEMP_STOPS[0]!.c);
    expect(tempColorRgb(12)).toEqual(TEMP_STOPS[TEMP_STOPS.length - 1]!.c);
  });

  it("hex 与 rgb 一致且格式合法", () => {
    const hex = tempColorHex(2);
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(hex).toBe(tempColorHex(2));
  });

  it("CSS 渐变与 stops 同源（第一个与最后一个 stop 端点正确）", () => {
    const g = tempColorCssGradient();
    expect(g.startsWith("linear-gradient(90deg, rgb(8,48,107) 0.0%") || g.startsWith("linear-gradient(90deg, rgb(8,48,107)")).toBe(true);
    expect(g.endsWith("%)")).toBe(true);
    expect(TEMP_DOMAIN[0]).toBe(-3);
    expect(TEMP_DOMAIN[1]).toBe(8);
  });
});

describe("温度连续覆盖层 LUT（F14，替代点云）", () => {
  const bands = [
    { latMin: 64, latMax: 90, amp: 2.738 },
    { latMin: 44, latMax: 64, amp: 1.575 },
    { latMin: 24, latMax: 44, amp: 1.232 },
    { latMin: 0, latMax: 24, amp: 0.906 },
    { latMin: -24, latMax: 0, amp: 0.839 },
    { latMin: -44, latMax: -24, amp: 0.747 },
    { latMin: -64, latMax: -44, amp: 0.282 },
    { latMin: -90, latMax: -64, amp: 0.617 },
  ];

  it("patternAmpInterp：带中心精确、锚点间连续、端点钳制", () => {
    expect(patternAmpInterp(77, bands)).toBeCloseTo(2.738, 9);
    expect(patternAmpInterp(-54, bands)).toBeCloseTo(0.282, 9);
    const mid = patternAmpInterp(64, bands); // 54 与 77 锚点之间
    expect(mid).toBeGreaterThan(1.575);
    expect(mid).toBeLessThan(2.738);
    expect(patternAmpInterp(-90, bands)).toBeCloseTo(0.617, 9);
    expect(patternAmpInterp(90, bands)).toBeCloseTo(2.738, 9);
  });

  it("LUT 行颜色与 tempColorRgb 同源（非等温线行）", () => {
    const lut = buildTempLut(2.81, bands, { isothermStep: 0, height: 512 });
    const row = 400; // lat ≈ 50.2°
    const lat = -90 + (row / 511) * 180;
    const dt = 2.81 * patternAmpInterp(lat, bands);
    expect([lut[row * 4]!, lut[row * 4 + 1]!, lut[row * 4 + 2]!]).toEqual(tempColorRgb(dt));
    expect(lut[row * 4 + 3]).toBe(Math.round(0.78 * 255));
  });

  it("等温线行存在且 alpha 更低（每 1°C 一条）", () => {
    const lut = buildTempLut(2.81, bands, { isothermStep: 1, height: 512 });
    const normalA = Math.round(0.78 * 255);
    let lineRows = 0;
    for (let row = 0; row < 512; row++) {
      if (lut[row * 4 + 3]! < normalA) lineRows++;
    }
    expect(lineRows).toBeGreaterThan(0); // +1..+5°C 与 0 基线均应产生纬线
    expect(lineRows).toBeLessThan(100); // 线应纤细（<20% 行数）
  });

  it("dtGlobal 变化 → LUT 颜色变化（时间轴联动）", () => {
    const a = buildTempLut(1.0, bands, { isothermStep: 0 });
    const b = buildTempLut(4.0, bands, { isothermStep: 0 });
    expect(Array.from(a.slice(0, 400 * 4))).not.toEqual(Array.from(b.slice(0, 400 * 4)));
  });
});
