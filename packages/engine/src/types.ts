/** v0 地球状态向量（SPEC §6.3）：温度为相对 1850 的异常（K），海平面各项为自起算年累计上升（m） */
export interface EarthState {
  co2: number;       // ppm
  ts: number;        // 表层温度异常 K（大气+海洋混合层）
  td: number;        // 深海温度异常 K
  sThermal: number;  // 热膨胀海平面 m
  sGlacier: number;  // 冰川消融海平面 m
  sGrIS: number;     // 格陵兰海平面 m
  sAIS: number;      // 南极海平面 m
  sLandWater: number;// 陆地水海平面 m
}
/** 外部驱动（每年插值） */
export interface Drivers {
  year: number; efossil: number; eluluc: number; // GtC/yr
  ch4: number; n2o: number;                      // ppb
  fOther: number;                                // W/m² 其他有效辐射强迫
  prescribedCo2?: number;                        // 浓度驱动模式（情景时段）：直接给定 CO₂ ppm
}
import type { ParameterId } from "@future-earth/spec";
/** 全参数字典（键由规格生成，访问即类型安全） */
export type Params = Record<ParameterId, number>;

export interface YearRecord {
  year: number; co2: number; tempAnomaly: number; oceanDeep: number; forcing: number;
  seaLevel: number; slThermal: number; slGlacier: number; slIceSheet: number; slLandWater: number;
  oceanUptake: number; landSink: number;
}
export interface SimResult {
  schemaVersion: 1; modelVersion: string; scenario: string; paramsFingerprint: string;
  years: number[];
  metrics: {
    tempAnomaly: number[]; co2: number[];
    seaLevel: { total: number[]; thermal: number[]; glacier: number[]; iceSheet: number[]; landWater: number[] };
  };
}
