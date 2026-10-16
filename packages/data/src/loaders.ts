// 数据访问统一入口：从生成的 TS 模块读取（可打包）；fs+manifest 校验见 manifest.test.ts
import { TEMPERATURE, CO2, EMISSIONS, FORCING, SCENARIOS, CITIES, WARMING_PATTERN, MANIFEST_HASH } from "./generated/datasets.gen.js";

/** 数据基线指纹（gen-bundle 从 manifest 规范化派生）：同一 hash = 同一数据基线 */
export const manifestHash = (): string => MANIFEST_HASH;

export type TemperatureRow = { year: number; anomaly: number };
export type Co2Row = { year: number; ppm: number };
export type EmissionsRow = { year: number; efossil: number; eluluc: number };
export type ForcingRow = { year: number; ch4: number; n2o: number; fOther: number };
export interface CityRow { name: string; country: string; lat: number; lon: number; elevation: number; population: number; tbase: number; pbase: number }
export interface PatternBand { latMin: number; latMax: number; amp: number }

export const loadTemperature = (): TemperatureRow[] => [...TEMPERATURE];
export const loadCO2 = (): Co2Row[] => [...CO2];
export const loadEmissions = (): EmissionsRow[] => [...EMISSIONS];
export const loadForcing = (): ForcingRow[] => [...FORCING];
export const loadCities = (): CityRow[] => [...CITIES];
export const loadWarmingPattern = (): PatternBand[] => (WARMING_PATTERN.length ? [...WARMING_PATTERN] : []);

export interface ScenarioSeries { id: string; name: string; years: number[]; efossil: number[]; eluluc: number[]; ch4: number[]; n2o: number[]; fOther: number[]; co2Conc: number[]; landWaterRate: number }
export function loadScenario(id: "ssp126" | "ssp245" | "ssp370" | "ssp585"): ScenarioSeries {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`情景不存在: ${id}`);
  return s as unknown as ScenarioSeries;
}
