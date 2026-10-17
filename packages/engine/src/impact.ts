/** V2.0 影响与适应——8 个影响模块（纯派生函数，零新耦合状态）
 *  口径：影响 ≠ 气候观测量；每个结果携带公式摘要/来源/适用范围/越界警告（I-04/I-05）。
 *  I-03：适应只改变影响链（暴露判定/损害系数），不改变基础气候状态。 */
import type { SimLike } from "./grid.js";
import type { CityRow } from "@future-earth/data";
import { crossingYears } from "./thresholds.js";

export type AdaptationLevel = "none" | "medium" | "high";

export interface ImpactMeta {
  formula: string;
  source: string;
  validRange: string;
  warnings: string[];
}

const at = (sim: SimLike, year: number, series: number[]): number => {
  const i = sim.years.indexOf(year);
  return series[i >= 0 ? i : sim.years.length - 1]!;
};

// ---------- 1. 暴露人口（I-01：与城市逐点聚合一致） ----------
export interface ExposureResult {
  exposedPopulation: number;   // 人
  floodedCount: number;        // 城市数
  floodedCities: Array<{ name: string; country: string; population: number }>;
  meta: ImpactMeta;
}
export function exposedPopulation(sim: SimLike, year: number, cities: CityRow[], adaptation: AdaptationLevel = "none"): ExposureResult {
  const slr = at(sim, year, sim.metrics.seaLevel.total);
  const defH = { none: 0, medium: 1.5, high: 3 }[adaptation];
  const flooded: ExposureResult["floodedCities"] = [];
  let pop = 0;
  for (const c of cities) {
    const defense = defH + (adaptation !== "none" && c.population >= 5_000_000 ? 1.5 : 0); // 大城额外防护
    if (c.elevation + defense <= slr) { flooded.push({ name: c.name, country: c.country, population: c.population }); pop += c.population; }
  }
  return {
    exposedPopulation: pop, floodedCount: flooded.length, floodedCities: flooded.slice(0, 10),
    meta: {
      formula: "暴露人口 = Σ 城市人口（高程 + 防护高程 ≤ SLR）",
      source: "GeoNames 人口/高程 × 引擎海平面",
      validRange: "城市点级（top 500 城市），非全国/全海岸",
      warnings: year > 2100 ? ["2100 年后为探索性外推"] : [],
    },
  };
}

// ---------- 2. 水资源（I-02：与区域水量守恒一致） ----------
export interface WaterResult {
  globalRunoff: number;        // mm/yr（全球陆地箱径流）
  perCapitaM3: number;         // m³/人/yr（全球径流总量 ÷ 人口）
  stressLevel: "低" | "中" | "高" | "极高";
  meta: ImpactMeta;
}
const GLOBAL_POP_2100 = 9.7e9; // UN 中位预测量级
export function waterStress(sim: SimLike, year: number): WaterResult {
  const i = sim.years.indexOf(year);
  const diag = sim.metrics.diagnostics;
  const runoff = diag ? diag.water.runoff[i >= 0 ? i : sim.years.length - 1]! : 380;
  // 全球陆地径流 mm/yr → 总量 m³/yr：runoff_mm × 1e-3 m × 1.49e14 m² = runoff × 1.49e11 m³
  const totalM3 = runoff * 1.49e11;
  const pc = totalM3 / GLOBAL_POP_2100; // m³/人/yr
  const stress = pc > 1700 ? "低" : pc > 1000 ? "中" : pc > 500 ? "高" : "极高";
  return {
    globalRunoff: runoff, perCapitaM3: Math.round(pc), stressLevel: stress,
    meta: {
      formula: "人均水资源 = 径流mm × 1.49e11 m³ ÷ 97亿人（Falkenmark 1700/1000/500 m³ 阈值）",
      source: "引擎水循环诊断 × UN 人口预测",
      validRange: "全球聚合（非流域级）",
      warnings: [],
    },
  };
}

// ---------- 3. 极端高温 ----------
export interface HeatResult {
  heatwaveDays: number;        // 天/yr（超过 35°C 日均的天数估计）
  deltaDays: number;           // 相对 2024 的增量
  meta: ImpactMeta;
}
export function extremeHeat(sim: SimLike, year: number): HeatResult {
  const dT = at(sim, year, sim.metrics.tempAnomaly);
  const dT24 = at(sim, 2024, sim.metrics.tempAnomaly);
  // 均值移位近似：热浪天数 ∝ exp(0.06·ΔT)·基准 ~12 天（教育性估计）
  const days = Math.round(12 * Math.exp(0.06 * dT));
  return {
    heatwaveDays: days, deltaDays: days - Math.round(12 * Math.exp(0.06 * dT24)),
    meta: {
      formula: "热浪日数 ≈ 12·exp(0.06·ΔT)（均值移位 + CC 变率假设）",
      source: "引擎温度 × 文献热浪响应系数",
      validRange: "全球平均（非城市热岛/区域分布）",
      warnings: dT > 6 ? ["ΔT > 6°C：超出经验拟合范围"] : [],
    },
  };
}

// ---------- 4. 农业适宜度 ----------
export interface AgriResult {
  growingDegreeDays: number;   // GDD °C·d/yr（基准温度 5°C 以上累积）
  waterBalance: number;        // mm/yr（P − E）
  suitability: "改善" | "稳定" | "恶化";
  meta: ImpactMeta;
}
export function agriculture(sim: SimLike, year: number): AgriResult {
  const dT = at(sim, year, sim.metrics.tempAnomaly);
  const i = sim.years.indexOf(year);
  const diag = sim.metrics.diagnostics;
  const p = diag ? diag.water.precip[i >= 0 ? i : sim.years.length - 1]! : 840;
  const e = diag ? diag.water.evap[i >= 0 ? i : sim.years.length - 1]! : 500;
  const gdd = Math.round(3000 + dT * 365 * 0.6); // 基准 GDD ~3000 °C·d/yr（全球陆地近似）
  const wb = Math.round(p - e);
  const suit = dT > 3 && wb < 200 ? "恶化" : dT < 1 ? "改善" : "稳定";
  return {
    growingDegreeDays: gdd, waterBalance: wb, suitability: suit,
    meta: {
      formula: "GDD 增量 ≈ 0.6·ΔT·365；水分平衡 = P − E",
      source: "引擎温度/水循环诊断 × FAO 生长度日近似",
      validRange: "全球平均（非作物/区域/季节）",
      warnings: dT > 5 ? ["ΔT > 5°C：农业系统可能发生非线性响应"] : [],
    },
  };
}

// ---------- 5. 生态迁移 ----------
export interface EcoResult {
  biomeShift: number;          // % 全球陆地格点群系改变
  crossings: ReturnType<typeof crossingYears>;
  meta: ImpactMeta;
}
export function ecology(sim: SimLike, year: number, baseYear = 2024): EcoResult {
  const cy = crossingYears(sim.years, sim.metrics.tempAnomaly);
  const dT = at(sim, year, sim.metrics.tempAnomaly) - at(sim, baseYear, sim.metrics.tempAnomaly);
  // 教育性估计：群系改变 ~ 每°C 约 8% 格点（气候带迁移速率近似）
  const shift = Math.min(80, Math.round(Math.abs(dT) * 8));
  return {
    biomeShift: shift, crossings: cy,
    meta: {
      formula: "群系改变 ≈ |ΔT| × 8%/°C（气候带迁移近似，上限 80%）",
      source: "引擎温度 × 生物地理文献迁移速率",
      validRange: "全球平均（非物种级/区域格局）",
      warnings: shift > 50 ? ["群系改变 > 50%：可能跨越临界点"] : [],
    },
  };
}

// ---------- 6. 海洋酸化 ----------
export interface AcidResult {
  ph: number;
  meta: ImpactMeta;
}
export function oceanAcid(sim: SimLike, year: number): AcidResult {
  const co2 = at(sim, year, sim.metrics.co2);
  // 教育性近似：ΔpH ≈ −0.3·ln(C₂/C₁)/ln(2)（CO₂ 翻倍 → pH 降约 0.3；Revell 因子简化）
  const ph = +(8.25 - 0.3 * Math.log2(co2 / 280)).toFixed(2);
  return {
    ph,
    meta: {
      formula: "pH ≈ 8.25 − 0.3·log₂(C/280)（Revell 因子简化）",
      source: "引擎 CO₂ × 文献海洋碳化学响应",
      validRange: "全球表平均（非深度/区域）",
      warnings: ph < 7.7 ? ["pH < 7.7：深海生态系统可能大面积受损"] : [],
    },
  };
}

// ---------- 7. 经济损害 ----------
export interface DamageResult {
  gdpLossPct: number;          // % 全球 GDP
  meta: ImpactMeta;
}
export function economicDamage(sim: SimLike, year: number, adaptation: AdaptationLevel = "none"): DamageResult {
  const dT = at(sim, year, sim.metrics.tempAnomaly);
  // 教育性经验公式：损失 ≈ 0.5%·ΔT + 0.01%·ΔT²（Nordhaus DICE 量级）；适应减 10-25%
  const raw = 0.5 * dT + 0.011 * dT * dT;
  const adj = raw * ({ none: 1, medium: 0.85, high: 0.75 }[adaptation]);
  return {
    gdpLossPct: +adj.toFixed(1),
    meta: {
      formula: "GDP 损失 ≈ (0.5·ΔT + 0.011·ΔT²) × 适应折扣（DICE 量级）",
      source: "引擎温度 × Nordhaus DICE 损害函数量级",
      validRange: "全球聚合（非国家级/行业分解）",
      warnings: dT > 5 ? ["ΔT > 5°C：损害函数外推不确定度极大"] : [],
    },
  };
}

// ---------- 8. 碳社会成本 ----------
export interface SccResult {
  scc: number;                 // $/tCO₂
  meta: ImpactMeta;
}
export function socialCarbonCost(sim: SimLike, year: number, discountRate = 0.03): SccResult {
  const dT = at(sim, year, sim.metrics.tempAnomaly);
  // 教育性：SCC ≈ 损失%·全球GDP(100T)·dΔT/dE ≈ 50·exp(0.04·ΔT)（DICE/Nordhaus 量级）；折现率修正
  const base = 50 * Math.exp(0.04 * dT);
  const disc = Math.exp(discountRate * (year - 2025));
  return {
    scc: Math.round(base / disc * (0.03 / discountRate)),
    meta: {
      formula: `SCC ≈ 50·exp(0.04·ΔT) ÷ exp(r·t)，r=${discountRate}`,
      source: "DICE 量级 × 引擎温度",
      validRange: "全球平均（非区域/代际公平分析）",
      warnings: ["碳社会成本对折现率高度敏感——本值为教育性估计"],
    },
  };
}

// ---------- 汇总入口 ----------
export interface ImpactSummary {
  year: number;
  exposure: ExposureResult;
  water: WaterResult;
  heat: HeatResult;
  agriculture: AgriResult;
  ecology: EcoResult;
  oceanAcid: AcidResult;
  damage: DamageResult;
  scc: SccResult;
}
export function runImpacts(sim: SimLike, year: number, cities: CityRow[], adaptation: AdaptationLevel = "none"): ImpactSummary {
  return {
    year,
    exposure: exposedPopulation(sim, year, cities, adaptation),
    water: waterStress(sim, year),
    heat: extremeHeat(sim, year),
    agriculture: agriculture(sim, year),
    ecology: ecology(sim, year),
    oceanAcid: oceanAcid(sim, year),
    damage: economicDamage(sim, year, adaptation),
    scc: socialCarbonCost(sim, year),
  };
}
