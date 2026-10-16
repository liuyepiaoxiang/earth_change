/** v2 地球状态向量（SPEC §6.3 + ADR-003 聚合箱扩展）：温度为相对 1850 的异常（K），
 *  海平面各项为自起算年累计上升（m），生物圈/冻土箱为全球聚合量 */
export interface EarthState {
  co2: number;       // ppm
  ts: number;        // 表层温度异常 K（大气+海洋混合层）
  td: number;        // 深海温度异常 K
  sThermal: number;  // 热膨胀海平面 m
  sGlacier: number;  // 冰川消融海平面 m
  sGrIS: number;     // 格陵兰海平面 m
  sAIS: number;      // 南极海平面 m
  sLandWater: number;// 陆地水海平面 m
  b: number;         // 植被生物量 GtC（v2 箱，初值 550 = 稳态）
  w: number;         // 土壤水分 mm（v2 箱，初值 800）
  mPf: number;       // 多年冻土碳 GtC（v2 箱，初值 1400）
  pTh: number;       // 已融冻土碳池 GtC（释放源，初值 0）
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
  biomass: number; soilMoisture: number; permafrost: number; // v2 箱诊断
}
/** 驱动段：1850-2024 排放驱动（碳循环闭合），2025 起浓度驱动（CO₂ 外生） */
export interface DriverSegment { from: number; to?: number; mode: "emissions-driven" | "concentration-driven" }
/** 置信标注：用于 UI 与 API 的可靠性分层 */
export interface ConfidenceNote { from: number; to?: number; label: string }
export interface ResultMetadata {
  modelScope: "global-box";
  driverMode: "hybrid";
  driverSegments: DriverSegment[];
  confidenceNotes: ConfidenceNote[];
  dataManifestHash: string;
}
export interface SimResult {
  schemaVersion: 2; modelVersion: string; scenario: string; paramsFingerprint: string;
  metadata: ResultMetadata;
  years: number[];
  metrics: {
    tempAnomaly: number[]; co2: number[];
    seaLevel: { total: number[]; thermal: number[]; glacier: number[]; iceSheet: number[]; landWater: number[] };
    biomass?: number[]; soilMoisture?: number[]; permafrost?: number[]; // v2 箱（GtC / mm / GtC，V2-06 起提供）
  };
}
