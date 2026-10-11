/** 纬度带升温放大系数（默认值来自 GISTEMP 分带回归量级；计划 B 用真实数据文件覆盖） */
export interface WarmingPatternBand { latMin: number; latMax: number; amp: number }
export const DEFAULT_WARMING_PATTERN: WarmingPatternBand[] = [
  { latMin: 60, latMax: 90, amp: 2.8 },
  { latMin: 44, latMax: 60, amp: 1.6 },
  { latMin: 24, latMax: 44, amp: 1.0 },
  { latMin: -24, latMax: 24, amp: 0.85 },
  { latMin: -44, latMax: -24, amp: 0.95 },
  { latMin: -60, latMax: -44, amp: 1.05 },
  { latMin: -90, latMax: -60, amp: 1.4 },
];
export function patternAmp(lat: number, pattern: WarmingPatternBand[] = DEFAULT_WARMING_PATTERN): number {
  const b = pattern.find((x) => lat >= x.latMin && lat < x.latMax) ?? pattern.at(-1)!;
  return b.amp;
}
/** eq_51: 温度模式缩放 ΔT(x,t) = ΔT_global(t)·Π(lat) */
export function localDTs(dTglobal: number, lat: number, pattern?: WarmingPatternBand[]): number {
  return dTglobal * patternAmp(lat, pattern);
}
/** eq_52: 降水标量缩放 P = P0·(1+0.02·ΔT_global) */
export function scaledPrecip(p0: number, dTglobal: number): number {
  return p0 * (1 + 0.02 * dTglobal);
}
/** eq_53: 城市淹没判定 */
export function isCityFlooded(elevationM: number, slrM: number): boolean {
  return elevationM <= slrM;
}
/** eq_49: 一般淹没判定（城市点级；全网格版属 v3） */
export function isLandAboveSea(elevationM: number, slrM: number): boolean {
  return elevationM > slrM;
}
/** eq_50: 生物群系判定（年均温 °C + 年降水 mm） */
export function classifyBiome(annualMeanT: number, annualP: number): string {
  if (annualMeanT < -8) return "冰雪";
  if (annualMeanT < 0) return "苔原";
  if (annualMeanT < 6) return "针叶林";
  if (annualP < 250) return "荒漠";
  if (annualMeanT < 13) return annualP > 700 ? "温带森林" : "草原";
  if (annualMeanT < 20) return annualP > 1200 ? "亚热带森林" : "稀树草原";
  return annualP > 1500 ? "热带森林" : "稀树草原";
}
