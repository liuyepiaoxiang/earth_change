import { describe, it, expect } from "vitest";
import { loadBaseGrid, cellIndexOf, GRID_T0, GRID_P0 } from "./loaders.js";

const g = loadBaseGrid();
const at = (lat: number, lon: number) => {
  const { i } = cellIndexOf(lat, lon);
  return { t: GRID_T0[i], p: GRID_P0[i] };
};

describe("V10-D01/D02 基准气候网格", () => {
  it("规模与分辨率", () => {
    expect(g.nLat).toBe(72);
    expect(g.nLon).toBe(144);
    expect(g.t0).toHaveLength(72 * 144);
  });
  it("全球（陆地）面积加权基准 T0 ∈ [5,20]°C、P0 ∈ [500,1200]mm", () => {
    let w = 0, tw = 0, pw = 0;
    for (let r = 0; r < 72; r++) {
      const wt = Math.cos(((90 - (r + 0.5) * 2.5) * Math.PI) / 180);
      for (let c = 0; c < 144; c++) {
        const i = r * 144 + c;
        if (g.t0[i] !== null) { w += wt; tw += wt * (g.t0[i] as number); pw += wt * (g.p0[i] as number); }
      }
    }
    expect(tw / w).toBeGreaterThan(5);
    expect(tw / w).toBeLessThan(20);
    expect(pw / w).toBeGreaterThan(500);
    expect(pw / w).toBeLessThan(1200);
  });
  it("G13 数据侧边界：撒哈拉干、赤道湿、东南极寒", () => {
    expect(at(23, 13).p ?? 999).toBeLessThan(250);   // 撒哈拉
    expect(at(0, 20).p ?? 0).toBeGreaterThan(1500);  // 刚果盆地
    expect(at(-80, 60).t ?? 0).toBeLessThan(-20);    // 东南极
  });
});
