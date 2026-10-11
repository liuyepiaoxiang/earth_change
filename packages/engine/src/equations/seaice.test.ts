import { describe, it, expect } from "vitest";
import { seaIceArea, surfaceAlbedo, iceAlbedoFeedback } from "./seaice.js";

describe("eq_28 海冰面积（logistic 诊断，ADR-001）", () => {
  it("经验锚点：1850（ΔT=0）≈8.9、+1.2°C≈7.4、+4°C≈1.2 M km²", () => {
    expect(seaIceArea(0)).toBeCloseTo(8.86, 1);
    expect(seaIceArea(1.2)).toBeCloseTo(7.4, 1);
    expect(seaIceArea(4)).toBeCloseTo(1.2, 1);
  });

  it("随升温单调递减，暖端趋近无冰（<0.01）、冷端趋近 A0（≤A0 钳制）", () => {
    let prev = seaIceArea(-2);
    expect(prev).toBeLessThanOrEqual(9.5);
    for (let t = -1; t <= 8; t += 0.5) {
      const a = seaIceArea(t);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(9.5);
      expect(a).toBeLessThanOrEqual(prev);
      prev = a;
    }
    expect(seaIceArea(10)).toBeLessThan(0.01);
  });
});

describe("eq_29 地表反照率（线性诊断，ADR-001）", () => {
  it("无冰损失 = α0；全冰损失 ≈ 0.6→0.06 的量级", () => {
    expect(surfaceAlbedo(9.5)).toBeCloseTo(0.3, 6);
    expect(surfaceAlbedo(0)).toBeCloseTo(0.3 - 0.03 * 9.5, 6);
  });

  it("随冰损失线性下降", () => {
    const a1 = surfaceAlbedo(8.5);
    const a2 = surfaceAlbedo(7.5);
    expect(a2).toBeLessThan(a1);
    expect(a1 - a2).toBeCloseTo(0.03, 6);
  });
});

describe("eq_30 冰-反照率反馈（辐射当量，ADR-001）", () => {
  it("反照率下降（Δα<0）产生变暖方向的正强迫", () => {
    const f = iceAlbedoFeedback(-0.02, 1.2);
    expect(f).toBeGreaterThan(0);
    expect(f).toBeCloseTo((1361 / 4) * 0.4 * 0.02, 6);
  });

  it("反照率上升产生负强迫；λ 不改变强迫（只影响后续温度响应）", () => {
    expect(iceAlbedoFeedback(0.02, 1.2)).toBeLessThan(0);
    expect(iceAlbedoFeedback(-0.02, 1.2)).toBeCloseTo(iceAlbedoFeedback(-0.02, 2.0), 6);
  });
});
