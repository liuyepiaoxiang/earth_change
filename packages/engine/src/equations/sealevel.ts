import type { EarthState, Params } from "../types.js";

/** eq_14: 热膨胀 dS_th/dt = k_th·γ·(Ts-Td) [m/yr] */
export function dSth(ts: number, td: number, p: Params): number {
  return p.k_thermal * p.gamma_ocean * (ts - td);
}
/** eq_26: 冰川消融 dS_g/dt = k_g·max(A_g·Ts,0)·max(1-S_g/G0,0) [m SLE/yr]，储量耗尽自动封顶 */
export function dSglacier(ts: number, sGlacier: number, p: Params): number {
  const dTg = Math.max(p.amp_glacier * ts, 0);
  return p.k_glacier * dTg * Math.max(1 - sGlacier / p.g0_glacier, 0);
}
/** eq_27a: 格陵兰 dS/dt = b0 + b1·Δ + b2·Δ²（Δ=A_Gr·Ts） */
export function dSgris(ts: number, p: Params): number {
  const d = Math.max(p.amp_gris * ts, 0);
  return p.b0_gris + p.b1_gris * d + p.b2_gris * d * d;
}
/** eq_27b: 南极 dS/dt = c0 + c1·Ts^1.5 */
export function dSais(ts: number, p: Params): number {
  return p.c0_ais + p.c1_ais * Math.pow(Math.max(ts, 0), 1.5);
}
/** eq_27: 冰盖两分量速率 */
export function iceSheetRates(ts: number, p: Params): { gris: number; ais: number } {
  return { gris: dSgris(ts, p), ais: dSais(ts, p) };
}
/** eq_31: 海平面加总 */
export function seaLevelSum(s: EarthState): number {
  return s.sThermal + s.sGlacier + s.sGrIS + s.sAIS + s.sLandWater;
}
/** eq_32: 海平面总变率（诊断） */
export function seaLevelRate(s: EarthState, p: Params): number {
  return dSth(s.ts, s.td, p) + dSglacier(s.ts, s.sGlacier, p) + dSgris(s.ts, p) + dSais(s.ts, p) + p.lw_rate;
}

// ---- eq_55: 海平面重力指纹（v4 诊断式，ADR-001；barystatic 自吸引/负荷原理，Mitrovica 量级） ----
// 物理本质：冰盖失质量后其引力减弱 + 地壳负荷回弹 → 近场海面反而下降，远场抬升 >1；
// 全局海面平均恒等于 barystatic 等效量（归一化保证 ⟨F_k⟩_ocean = 1）。

/** 海平面五分量（冰盖按 GRIS/AIS 拆分——指纹形状不同向） */
export interface SlrComponents {
  thermal: number;
  glacier: number;
  gris: number;
  ais: number;
  landWater: number;
}

/** 1° 纬度海洋面积权重节点（ETOPO 量级近似：cosφ 已在权重中乘，此处仅海洋占比，线性插值） */
const OCEAN_FRAC_NODES: ReadonlyArray<readonly [number, number]> = [
  [-90, 0.02], [-78, 0.1], [-66, 0.55], [-55, 0.97], [-45, 0.96], [-35, 0.9],
  [-25, 0.75], [-15, 0.72], [-5, 0.75], [5, 0.76], [15, 0.73], [25, 0.65],
  [35, 0.6], [45, 0.52], [55, 0.55], [65, 0.35], [75, 0.35], [85, 0.92], [90, 1.0],
];

function oceanFrac(lat: number): number {
  if (lat <= OCEAN_FRAC_NODES[0]![0]) return OCEAN_FRAC_NODES[0]![1];
  for (let i = 1; i < OCEAN_FRAC_NODES.length; i++) {
    const [lat1, f1] = OCEAN_FRAC_NODES[i]!;
    if (lat <= lat1) {
      const [lat0, f0] = OCEAN_FRAC_NODES[i - 1]!;
      const t = (lat - lat0) / (lat1 - lat0);
      return f0 + (f1 - f0) * t;
    }
  }
  return OCEAN_FRAC_NODES[OCEAN_FRAC_NODES.length - 1]![1];
}

/** f 在全球海洋上的面积加权平均（1° 离散，确定性） */
function oceanMean(f: (lat: number) => number): number {
  let num = 0;
  let den = 0;
  for (let lat = -90; lat <= 90; lat++) {
    const w = Math.cos((lat * Math.PI) / 180) * oceanFrac(lat);
    num += w * f(lat);
    den += w;
  }
  return num / den;
}

/** 原始形状：格陵兰（中心 72°N）与南极（中心 75°S）高斯近场凹陷，远场 →1 */
const rawGris = (lat: number) => 1 - 1.6 * Math.exp(-(((lat - 72) / 28) ** 2));
const rawAis = (lat: number) => 1 - 1.35 * Math.exp(-(((lat + 75) / 30) ** 2));

/** 归一化常数（模块加载时一次算定，保证海洋面积加权平均 = 1） */
const Z_GRIS = oceanMean(rawGris);
const Z_AIS = oceanMean(rawAis);

/** GRIS 失质量的局地海平面响应系数（近场 <0，远场 ≈1.1） */
export function fingerprintGRIS(lat: number): number {
  return rawGris(lat) / Z_GRIS;
}
/** AIS 失质量的局地海平面响应系数（近场 <0，远场 ≈1.2） */
export function fingerprintAIS(lat: number): number {
  return rawAis(lat) / Z_AIS;
}

/** eq_55: 区域海平面 = 热膨胀 + 冰川 + 陆地水（v0 近似均匀）+ 冰盖两分量按指纹缩放 */
export function regionalSeaLevel(lat: number, c: SlrComponents): number {
  return c.thermal + c.glacier + c.landWater + c.gris * fingerprintGRIS(lat) + c.ais * fingerprintAIS(lat);
}
export function slrComponentsTotal(c: SlrComponents): number {
  return c.thermal + c.glacier + c.landWater + c.gris + c.ais;
}
