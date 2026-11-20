import { describe, it, expect } from "vitest";
import { sparkPoints } from "./spark-path";

describe("spark-path（Sparkline SVG 与 city-card canvas 共用）", () => {
  it("连续值 → 单段；坐标在 [pad, width-pad]×[pad, height-bottom] 域内且单调 x", () => {
    const segs = sparkPoints([1, 2, 3, 4], 100, 50, { pad: 4, bottom: 8 });
    expect(segs).toHaveLength(1);
    const seg = segs[0]!;
    expect(seg).toHaveLength(4);
    for (const p of seg) {
      expect(p.x).toBeGreaterThanOrEqual(4);
      expect(p.x).toBeLessThanOrEqual(96);
      expect(p.y).toBeGreaterThanOrEqual(4);
    }
    for (let i = 1; i < seg.length; i++) expect(seg[i]!.x).toBeGreaterThan(seg[i - 1]!.x);
  });

  it("null 断开 → 多段；末值最小 → 段内 y 递减（值升 y 降的屏幕坐标语义）", () => {
    const segs = sparkPoints([1, 2, null, 3, 4], 100, 50);
    expect(segs).toHaveLength(2);
    expect(segs[0]).toHaveLength(2);
    expect(segs[1]).toHaveLength(2);
  });

  it("全 null / 点数 <2 → 空数组", () => {
    expect(sparkPoints([null, null, null], 100, 50)).toEqual([]);
    expect(sparkPoints([1], 100, 50)).toEqual([]);
  });
});
