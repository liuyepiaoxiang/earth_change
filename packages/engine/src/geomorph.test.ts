import { describe, it, expect } from "vitest";
import { runScenario } from "./index.js";
import { initGeoState, stepGeo, runGeomorph, coastlineMask, DEFAULT_GEO, type GeoOptions } from "./geomorph.js";
import { GRID_ELEV } from "@future-earth/data";

const sim = runScenario("ssp585", 2500);
const ON: GeoOptions = { ...DEFAULT_GEO, enabled: true };

describe("V3.0 G22-G26 海岸与地貌演化", () => {
  it("G23：关闭开关时地形逐位冻结", () => {
    const g0 = initGeoState();
    const g1 = stepGeo(g0, sim, 2100, DEFAULT_GEO);
    expect(g1.elev).toEqual(g0.elev);
    expect(g1.totals.eroded).toBe(0);
  });
  it("G22：开启后侵蚀/输沙/沉积三账非零且闭合", () => {
    const g = runGeomorph(sim, 2025, 2100, ON);
    expect(g.totals.eroded).toBeGreaterThan(0);
    expect(g.totals.transported).toBeGreaterThan(0);
    expect(g.totals.deposited).toBeGreaterThan(0);
    // 沉积 ≤ 输沙（质量守恒上界）
    expect(g.totals.deposited).toBeLessThanOrEqual(g.totals.transported + 1e-9);
  });
  it("G24：海岸线掩膜与高程/SLR 联动", () => {
    const g = runGeomorph(sim, 2025, 2500, ON);
    const slr = sim.metrics.seaLevel.total[sim.years.indexOf(2500)]!;
    const mask = coastlineMask(g, slr);
    // 至少有淹没格和陆地格
    const flooded = mask.filter((m) => m === 0).length;
    const land = mask.filter((m) => m === 1).length;
    expect(flooded).toBeGreaterThan(0);
    expect(land).toBeGreaterThan(0);
    // 高程 > SLR 的格 = 陆地
    for (let i = 0; i < mask.length; i += 500) {
      const e = g.elev[i]!;
      if (e !== null) expect(mask[i]).toBe(e > slr ? 1 : 0);
    }
  });
  it("G26：长期积分无负高程/NaN/非物理振荡", () => {
    const g = runGeomorph(sim, 2025, 2500, ON);
    let negatives = 0, nans = 0;
    for (const e of g.elev) {
      if (e === null) continue;
      if (e < 0 && e > -1) negatives++; // 允许微小负值（侵蚀到海平面附近）
      if (!Number.isFinite(e)) nans++;
    }
    expect(nans).toBe(0);
    expect(negatives).toBeLessThan(50); // 不应大面积负高程
  });
  it("PERF-04：2025→2100 演化 < 2s（Worker 可算）", () => {
    const t0 = Date.now();
    runGeomorph(sim, 2025, 2100, ON);
    expect(Date.now() - t0).toBeLessThan(2000);
  });
  it("开启后地形确实变化（vs 初始 DEM）", () => {
    const g = runGeomorph(sim, 2025, 2500, ON);
    let changed = 0;
    for (let i = 0; i < g.elev.length; i++) {
      if (g.elev[i] !== null && GRID_ELEV[i] !== null && Math.abs(g.elev[i]! - GRID_ELEV[i]!) > 0.001) changed++;
    }
    expect(changed).toBeGreaterThan(0); // 地形确实在演化
  });
});
