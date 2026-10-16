/** V1.0 区域化气候场：派生式网格（基准场 + 全球 SimResult 模式缩放）
 *  口径：2.5° 教育性格点场；温度场 = T0 + ΔT_global(t)·amp(lat,陆海)（amp 面积加权归一 → G10 构造性）；
 *  降水场 = P0·(1+0.02·ΔT_global)；逐格水循环为按需桶模型（复用 water.ts 同源函数 → G11 构造性）。 */
import { GRID_RES, GRID_NLAT, GRID_NLON, GRID_T0, GRID_P0, GRID_LAND } from "@future-earth/data";
import { loadWarmingPattern } from "@future-earth/data";
import * as water from "./equations/water.js";
import { classifyBiome } from "./equations/downscale.js";
import type { SimResult } from "./types.js";

export const GRID = { res: GRID_RES, nLat: GRID_NLAT, nLon: GRID_NLON } as const;
export type Field = Array<number | null>;

const cellLat = (r: number) => 90 - (r + 0.5) * GRID_RES;
const cellLon = (c: number) => -180 + (c + 0.5) * GRID_RES;
export { cellLat, cellLon };

/** 纬度带放大（GISTEMP 分带回归数据优先，回退内置） */
function zonalAmp(lat: number): number {
  const bands = loadWarmingPattern().length ? loadWarmingPattern() : [
    { latMin: -90, latMax: -60, amp: 1.4 }, { latMin: -60, latMax: -44, amp: 1.05 },
    { latMin: -44, latMax: -24, amp: 0.95 }, { latMin: -24, latMax: 0, amp: 0.9 },
    { latMin: 0, latMax: 24, amp: 0.9 }, { latMin: 24, latMax: 44, amp: 1.0 },
    { latMin: 44, latMax: 60, amp: 1.6 }, { latMin: 60, latMax: 90, amp: 2.8 },
  ];
  const b = bands.find((x) => lat >= x.latMin && lat < x.latMax) ?? bands.at(-1)!;
  return b.amp;
}

/** 逐格放大系数（极地放大 × 陆地增强/海洋衰减），面积加权归一 → 全球均值 ≡ 1（G10） */
let ampCache: Field | null = null;
export function ampField(): Field {
  if (ampCache) return ampCache;
  const raw: number[] = new Array(GRID_NLAT * GRID_NLON);
  let wsum = 0, asum = 0;
  for (let r = 0; r < GRID_NLAT; r++) {
    const w = Math.cos((cellLat(r) * Math.PI) / 180);
    for (let c = 0; c < GRID_NLON; c++) {
      const i = r * GRID_NLON + c;
      const v = zonalAmp(cellLat(r)) * (GRID_LAND[i] ? 1.3 : 0.85);
      raw[i] = v;
      wsum += w; asum += w * v;
    }
  }
  const norm = asum / wsum; // 归一化常数
  ampCache = raw.map((v) => +(v / norm).toFixed(6));
  return ampCache;
}

const interp = (years: number[], vals: number[], y: number): number => {
  if (y <= years[0]!) return vals[0]!;
  if (y >= years.at(-1)!) return vals.at(-1)!;
  let i = 0;
  while (years[i + 1]! < y) i++;
  const t = (y - years[i]!) / (years[i + 1]! - years[i]!);
  return vals[i]! * (1 - t) + vals[i + 1]! * t;
};

/** 全球 ΔT(t) 从 SimResult 插值 */
export function globalDT(sim: SimResult, year: number): number {
  return interp(sim.years, sim.metrics.tempAnomaly, year);
}

/** 温度异常场（全格有值；海洋 amp=衰减项） */
export function anomalyField(sim: SimResult, year: number): Field {
  const dT = globalDT(sim, year);
  const amp = ampField();
  return amp.map((a) => (a === null ? null : +(a * dT).toFixed(4)));
}

/** 绝对温度场 °C（T0 缺测格为 null——WorldClim 为陆地数据） */
export function temperatureField(sim: SimResult, year: number): Field {
  const anom = anomalyField(sim, year);
  return GRID_T0.map((t0, i) => (t0 === null ? null : +(t0 + (anom[i] as number)).toFixed(2)));
}

/** 降水场 mm/yr（P = P0·(1+0.02·ΔT_global)，与 eq_52 同源） */
export function precipField(sim: SimResult, year: number): Field {
  const k = 1 + 0.02 * globalDT(sim, year);
  return GRID_P0.map((p0) => (p0 === null ? null : +(p0 * k).toFixed(0)));
}

/** 逐格水循环（按需桶模型，复用 water.ts 同源函数）：返回该格 1850→year 的年度序列与终态
 *  E 口径：E = E0·evap(ΔTg)/evap(0)，E0 = P0·0.595（全球 E0/P0 比例，water.ts 默认 500/840） */
export interface CellWaterSeries { years: number[]; p: number[]; e: number[]; runoff: number[]; w: number[]; snow: number[] }
export function cellWaterTimeline(sim: SimResult, cellIndex: number, throughYear: number): CellWaterSeries | null {
  const p0 = GRID_P0[cellIndex];
  const t0 = GRID_T0[cellIndex];
  if (p0 == null || t0 == null) return null;
  const e0 = p0 * (500 / 840);
  let W = 800, Msnow = 0;
  const years: number[] = [], P: number[] = [], E: number[] = [], R: number[] = [], Ws: number[] = [], S: number[] = [];
  for (let y = 1850; y <= throughYear; y++) {
    const dTg = globalDT(sim, y);
    const p = p0 * (1 + 0.02 * dTg);
    const e = e0 * (water.evaporation(dTg) / water.evaporation(0)!);
    const r = water.runoff(W, p, e);
    W = water.waterBalanceStep(W, p, e); // 返回新 W（容量钳制）
    const tLocalC = t0 + dTg * zonalAmp(cellLat(Math.floor(cellIndex / GRID_NLON))); // °C（snowStep 以 <0 为冻结）
    Msnow = Math.max(0, Msnow + water.snowStep(Msnow, p, tLocalC));
    years.push(y); P.push(+p.toFixed(1)); E.push(+e.toFixed(1)); R.push(+r.toFixed(1)); Ws.push(+W.toFixed(1)); S.push(+Msnow.toFixed(1));
  }
  return { years, p: P, e: E, runoff: R, w: Ws, snow: S };
}

/** 海冰覆盖诊断（教育性）：海洋格随升温向极收缩 */
export function gridSeaIceFraction(lat: number, dTg: number): number {
  const edge = 64 + 5 * dTg; // 增温 → 边缘向极地收缩
  if (lat < 0) return Math.max(0, Math.min(1, (-lat - edge) / 8));
  return Math.max(0, Math.min(1, (lat - edge) / 8));
}

/** 植被适宜度（群系判定，复用 classifyBiome） */
export function gridBiome(sim: SimResult, cellIndex: number, year: number): string | null {
  const t = temperatureField(sim, year)[cellIndex];
  const p = precipField(sim, year)[cellIndex];
  if (t == null || p == null) return null;
  return classifyBiome(t, p);
}

// ---- 采样与区域统计（V10-E04）----
export function sampleGrid(field: Field, lat: number, lon: number): number | null {
  const r = Math.min(GRID_NLAT - 1, Math.max(0, Math.floor((90 - lat) / GRID_RES)));
  const c = Math.min(GRID_NLON - 1, Math.max(0, Math.floor((lon + 180) / GRID_RES)));
  return field[r * GRID_NLON + c] ?? null;
}

export interface RegionStats { n: number; mean: number; min: number; max: number; p10: number; p90: number }
/** bbox = [latS, latN, lonW, lonE]，面积加权（cos lat） */
export function regionStats(field: Field, latS: number, latN: number, lonW: number, lonE: number): RegionStats | null {
  const vals: Array<{ v: number; w: number }> = [];
  for (let r = 0; r < GRID_NLAT; r++) {
    const lat = cellLat(r);
    if (lat < latS || lat > latN) continue;
    const w = Math.cos((lat * Math.PI) / 180);
    for (let c = 0; c < GRID_NLON; c++) {
      const lon = cellLon(c);
      if (lon < lonW || lon > lonE) continue;
      const v = field[r * GRID_NLON + c];
      if (v !== null && v !== undefined) vals.push({ v, w });
    }
  }
  if (vals.length === 0) return null;
  const wsum = vals.reduce((a, x) => a + x.w, 0);
  const sorted = [...vals].sort((a, b) => a.v - b.v);
  const q = (p: number): number => {
    let acc = 0;
    for (const x of sorted) { acc += x.w; if (acc >= p * wsum) return x.v; }
    return sorted.at(-1)!.v;
  };
  return {
    n: vals.length,
    mean: +(vals.reduce((a, x) => a + x.v * x.w, 0) / wsum).toFixed(3),
    min: sorted[0]!.v, max: sorted.at(-1)!.v,
    p10: q(0.1), p90: q(0.9),
  };
}

/** Worker 消费入口：一年一组的派生场 */
export interface GridFields { year: number; anomaly: Field; temperature: Field; precip: Field }
export function runGridFields(sim: SimResult, year: number): GridFields {
  return { year, anomaly: anomalyField(sim, year), temperature: temperatureField(sim, year), precip: precipField(sim, year) };
}
