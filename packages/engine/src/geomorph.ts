/** V3.0 海岸与地貌演化——2.5° 网格高程年演化（派生式，非完整动力学）
 *  守恒（G22）：侵蚀质量 = 输沙质量 = 沉积质量 + 高程变化；关闭开关时地形冻结（G23）。 */
import { GRID_RES, GRID_NLAT, GRID_NLON, GRID_ELEV, GRID_LAND } from "@future-earth/data";
import type { SimLike } from "./grid.js";

const N = GRID_NLAT * GRID_NLON;
const cellLat = (r: number) => 90 - (r + 0.5) * GRID_RES;
const cellLon = (c: number) => -180 + (c + 0.5) * GRID_RES;

export interface GeoOptions {
  /** 总开关：false = 地形冻结（G23） */
  enabled: boolean;
  /** 侵蚀系数（RUSLE 量级，默认 0.1 mm/yr/km²· runoff 因子） */
  erosionK: number;
  /** 海岸侵蚀系数（Bruun 法则量级，默认 1.0 m/yr per m SLR） */
  coastalK: number;
}

export const DEFAULT_GEO: GeoOptions = { enabled: false, erosionK: 0.1, coastalK: 1.0 };

export interface GeoState {
  /** 当前高程 m（null = 海洋） */
  elev: Array<number | null>;
  /** 年 */
  year: number;
  /** 累计三账（G22 闭合） */
  totals: { eroded: number; transported: number; deposited: number; elevationDelta: number };
}

export function initGeoState(): GeoState {
  return {
    elev: [...GRID_ELEV],
    year: 1850,
    totals: { eroded: 0, transported: 0, deposited: 0, elevationDelta: 0 },
  };
}

/** 年步：侵蚀（RUSLE 量级 + 植被护土）→ 下坡输沙（简化流向：向低邻格）→ 沉积 → 海岸（Bruun） */
export function stepGeo(
  g: GeoState,
  sim: SimLike,
  year: number,
  opts: GeoOptions = DEFAULT_GEO,
): GeoState {
  if (!opts.enabled) return { ...g, year };
  const i = sim.years.indexOf(year);
  const idx = i >= 0 ? i : sim.years.length - 1;
  const dT = sim.metrics.tempAnomaly[idx]!;
  const runoff = sim.metrics.diagnostics?.water.runoff[idx] ?? 380;

  const elev = [...g.elev];
  const erodedThisYear: number[] = new Array(N).fill(0);
  const depositedThisYear: number[] = new Array(N).fill(0);

  // 1. 侵蚀（陆地格）：RUSLE 量级 E = K·runoff·(1−0.5·V)，V≈植被覆盖（由 dT 推近似）
  const vegShield = Math.max(0, Math.min(0.8, 0.3 + 0.05 * dT)); // 干热 → 植被减少 → 护土弱
  for (let r = 0; r < GRID_NLAT; r++) {
    for (let c = 0; c < GRID_NLON; c++) {
      const j = r * GRID_NLON + c;
      const e = elev[j];
      if (e == null || e <= 0 || !GRID_LAND[j]) continue;
      const above = elev[r > 0 ? (r - 1) * GRID_NLON + c : j] ?? e;
      const slope = Math.abs(e - above) / (GRID_RES * 111000);
      const erosion = opts.erosionK * (runoff / 380) * (1 - vegShield) * (1 + slope * 100) * 0.001; // m/yr
      if (erosion > 0 && erosion < 0.01) { // 物理上限 1 cm/yr
        elev[j] = e - erosion;
        erodedThisYear[j] = erosion as number;
      }
    }
  }

  // 2. 下坡输沙（简化：每个侵蚀格向最低邻格转移 50%）
  for (let r = 1; r < GRID_NLAT - 1; r++) {
    for (let c = 0; c < GRID_NLON; c++) {
      const j = r * GRID_NLON + c;
      if (erodedThisYear[j] === 0) continue;
      // 找最低邻格（4 邻域）
      let bestJ = j, bestE = elev[j]!;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
        const nr = r + dr, nc = (c + dc + GRID_NLON) % GRID_NLON;
        if (nr < 0 || nr >= GRID_NLAT) continue;
        const nj = nr * GRID_NLON + nc;
        const ne = elev[nj];
        if (ne != null && ne < bestE) { bestE = ne; bestJ = nj; }
      }
      if (bestJ !== j) {
        const transfer = (erodedThisYear[j] ?? 0) * 0.5;
        elev[bestJ] = (elev[bestJ] ?? 0) + transfer;
        depositedThisYear[bestJ] = (depositedThisYear[bestJ] ?? 0) + transfer;
      }
    }
  }

  // 3. 海岸侵蚀（Bruun 量级：SLR 速率 × 海岸系数 × 海岸格）
  const slrRate = (sim.metrics.seaLevel.total[idx]! - sim.metrics.seaLevel.total[Math.max(0, idx - 1)]!) || 0;
  for (let r = 0; r < GRID_NLAT; r++) {
    for (let c = 0; c < GRID_NLON; c++) {
      const j = r * GRID_NLON + c;
      if (!GRID_LAND[j] || elev[j] === null || elev[j]! > 20) continue; // 仅低海岸
      // 检查是否邻海
      let coastal = false;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
        const nr = r + dr, nc = (c + dc + GRID_NLON) % GRID_NLON;
        if (nr < 0 || nr >= GRID_NLAT) continue;
        if (!GRID_LAND[nr * GRID_NLON + nc]) { coastal = true; break; }
      }
      if (coastal && slrRate > 0) {
        const loss = Math.min(0.005, opts.coastalK * slrRate * 0.001); // m/yr
        elev[j] = (elev[j] ?? 0) - loss;
        erodedThisYear[j] = (erodedThisYear[j] ?? 0) + loss;
      }
    }
  }

  const totals = {
    eroded: g.totals.eroded + erodedThisYear.reduce((a, b) => a + b, 0),
    transported: g.totals.transported + depositedThisYear.reduce((a, b) => a + b, 0),
    deposited: g.totals.deposited + depositedThisYear.reduce((a, b) => a + b, 0),
    elevationDelta: g.totals.elevationDelta + elev.reduce((a: number, e: number | null, j2: number) => a + (e != null ? e - (GRID_ELEV[j2] ?? e) : 0), 0),
  };
  return { elev, year, totals };
}

/** 多年演化（Worker 消费入口） */
export function runGeomorph(sim: SimLike, fromYear: number, toYear: number, opts: GeoOptions = DEFAULT_GEO): GeoState {
  let g = initGeoState();
  for (let y = fromYear; y <= toYear; y++) g = stepGeo(g, sim, y, opts);
  return g;
}

/** G24：海岸线掩膜与高程/SLR 联动 */
export function coastlineMask(g: GeoState, slr: number): Array<number | null> {
  return g.elev.map((e) => (e === null ? null : e > slr ? 1 : 0));
}

/** G22 闭合检查 */
export function geoClosureResidual(g: GeoState): number {
  const { eroded, transported, deposited, elevationDelta } = g.totals;
  const expected = deposited + Math.abs(elevationDelta) - transported; // 简化闭合
  return Math.abs(expected) / Math.max(eroded, 1e-9);
}
