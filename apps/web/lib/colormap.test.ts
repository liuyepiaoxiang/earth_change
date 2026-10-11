import { describe, it, expect } from "vitest";
import { tempColorRgb, tempColorHex, tempColorCssGradient, TEMP_STOPS, TEMP_DOMAIN } from "./colormap";

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
