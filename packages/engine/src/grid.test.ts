import { describe, it, expect } from "vitest";
import { runScenario } from "./index.js";
import {
  ampField, anomalyField, temperatureField, precipField, globalDT,
  cellWaterTimeline, gridSeaIceFraction, gridBiome, sampleGrid, regionStats, GRID, cellLat,
} from "./grid.js";
import { GRID_NLON, GRID_T0, GRID_P0, GRID_LAND, cellIndexOf } from "@future-earth/data";

const sim = runScenario("ssp585", 2500);
const wMean = (f: Array<number | null>): number => {
  let w = 0, s = 0;
  for (let r = 0; r < GRID.nLat; r++) {
    const wt = Math.cos((cellLat(r) * Math.PI) / 180);
    for (let c = 0; c < GRID.nLon; c++) {
      const v = f[r * GRID.nLon + c];
      if (v != null) { w += wt; s += wt * v; }
    }
  }
  return s / w;
};

describe("G10：网格加权全球均值 ≡ 0D 核心", () => {
  it("amp 场面积加权均值 = 1", () => {
    expect(Math.abs(wMean(ampField()) - 1)).toBeLessThan(0.01);
  });
  for (const y of [2024, 2100, 2500]) {
    it(`异常场均值 = ΔT_global(${y}) ± 0.002`, () => {
      expect(Math.abs(wMean(anomalyField(sim, y)) - globalDT(sim, y))).toBeLessThan(0.002);
    });
  }
});

describe("G11：格点年水量守恒（桶模型同源构造）", () => {
  it("ΔW == P − E − R 逐年成立（取撒哈拉与刚果两格）", () => {
    for (const [lat, lon] of [[23, 13], [0, 20]] as const) {
      const { i } = cellIndexOf(lat, lon);
      const tl = cellWaterTimeline(sim, i, 1875)!;
      expect(tl.p.length).toBe(26);
      for (let k = 1; k < tl.p.length; k++) {
        const wPrev = tl.w[k - 1]!;
        const wNext = tl.w[k]!;
        const r = tl.runoff[k - 1]!;
        const expected = Math.min(1500, Math.max(0, wPrev + tl.p[k - 1]! - tl.e[k - 1]! - r));
        expect(Math.abs(wNext - expected)).toBeLessThan(0.11); // 与 water.ts 同源构造 + toFixed(1) 舍入
        // 未触边界时严格成立 ΔW = P − E − R
        if (wPrev > 100 && wPrev < 1400) {
          expect(Math.abs(wNext - wPrev - (tl.p[k - 1]! - tl.e[k - 1]! - r))).toBeLessThan(0.11);
        }
        expect(wNext).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("G12：分辨率收敛（2.5° 聚合 5°）", () => {
  it("聚合后全球加权异常均值差 < 0.002", () => {
    const f = anomalyField(sim, 2100);
    const agg: Array<number | null> = [];
    for (let r = 0; r < GRID.nLat; r += 2) for (let c = 0; c < GRID.nLon; c += 2) {
      const vs = [f[r * GRID.nLon + c]!, f[r * GRID.nLon + c + 1]!, f[(r + 1) * GRID.nLon + c]!, f[(r + 1) * GRID.nLon + c + 1]!];
      agg.push(vs.reduce((a, b) => a + b, 0) / 4);
    }
    // 聚合场权重按 5° 纬度
    let w = 0, s = 0, k = 0;
    for (let r = 0; r < 36; r++) {
      const wt = Math.cos((90 - (r + 0.5) * 5) * Math.PI / 180);
      for (let c = 0; c < 72; c++) { w += wt; s += wt * (agg[k] as number); k++; }
    }
    expect(Math.abs(s / w - globalDT(sim, 2100))).toBeLessThan(0.002);
  });
});

describe("G13：边界值健全", () => {
  it("极地放大与陆海差异", () => {
    const anom = anomalyField(sim, 2100);
    const at = (lat: number, lon: number) => sampleGrid(anom, lat, lon)!;
    expect(at(80, 0)).toBeGreaterThan(at(0, 20));            // 北极 > 赤道
    expect(at(55, 30)).toBeGreaterThan(at(55, -30));         // 同纬度陆地(欧) > 海洋(大西洋)
  });
  it("撒哈拉/刚果/东南极格点量级", () => {
    const T = temperatureField(sim, 2100);
    const P = precipField(sim, 2100);
    const { i: sah } = cellIndexOf(23, 13);
    const { i: con } = cellIndexOf(0, 20);
    const { i: ant } = cellIndexOf(-80, 60);
    expect(P[con]!).toBeGreaterThan(1500);
    expect(P[sah]!).toBeLessThan(400);
    expect(T[ant]!).toBeLessThan(-15);
  });
  it("海冰向极收缩：ΔT 越高边界纬度越高", () => {
    expect(gridSeaIceFraction(70, 0)).toBeGreaterThan(0);
    expect(gridSeaIceFraction(70, 5)).toBe(0);
    expect(gridSeaIceFraction(50, 5)).toBe(0);
  });
});

describe("G14：确定性与采样/统计", () => {
  it("两次计算逐位一致", () => {
    expect(JSON.stringify(temperatureField(sim, 2150))).toBe(JSON.stringify(temperatureField(sim, 2150)));
  });
  it("sampleGrid 与区域统计", () => {
    const T = temperatureField(sim, 2100);
    const v = sampleGrid(T, 23, 13);
    expect(v).not.toBeNull();
    const st = regionStats(T, 10, 30, -10, 30)!; // 北非-中东
    expect(st.n).toBeGreaterThan(50);
    expect(st.min).toBeLessThanOrEqual(st.mean);
    expect(st.mean).toBeLessThanOrEqual(st.max);
    expect(st.p10).toBeLessThanOrEqual(st.p90);
  });
  it("群系判定：赤道雨林/撒哈拉荒漠", () => {
    const { i: con } = cellIndexOf(0, 20);
    const { i: sah } = cellIndexOf(23, 13);
    expect(["热带森林", "亚热带森林"]).toContain(gridBiome(sim, con, 2100));
    expect(gridBiome(sim, sah, 2100)).toBe("荒漠");
  });
});
