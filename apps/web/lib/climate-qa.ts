/** AI 气候问答——规则引擎版（Phase 1）
 *  理解用户问题 → 提取实体（城市/情景/年份/指标）→ 运行模拟 → 生成回答 + 数据 */
import { runScenario, crossingYears, isCityFlooded, localDTs } from "@future-earth/engine";
import type { ScenarioId, SimResult } from "@future-earth/engine";
import { loadCities, loadWarmingPattern } from "@future-earth/data";
import type { CityRow } from "@future-earth/data";


export interface QAResult {
  question: string;
  answer: string;
  data: { year: number; value: number; unit: string; label: string }[];
  city?: string;
  scenario: string;
  visualization: "timeline" | "threshold" | "comparison" | "none";
  sources: string[];
  followUps: string[];
}

// ---- 实体提取 ----

function extractScenario(q: string): ScenarioId {
  const lower = q.toLowerCase();
  if (lower.includes("1-2.6") || lower.includes("1.2.6") || lower.includes("低排放") || lower.includes("low emission") || lower.includes("best case")) return "ssp126";
  if (lower.includes("3-7.0") || lower.includes("3.7.0") || lower.includes("中高") || lower.includes("medium-high")) return "ssp370";
  if (lower.includes("5-8.5") || lower.includes("5.8.5") || lower.includes("高排放") || lower.includes("high emission") || lower.includes("worst")) return "ssp585";
  return "ssp245";
}

function extractYear(q: string): number {
  const match = q.match(/(20[2-9]\d|21[0-4]\d|2500)/);
  if (match) return parseInt(match[1]!);
  if (q.includes("mid-century") || q.includes("世纪中")) return 2050;
  if (q.includes("end of century") || q.includes("本世纪末")) return 2100;
  return 2100;
}

function extractCity(q: string): CityRow | null {
  const cities = loadCities();
  const lower = q.toLowerCase();
  for (const c of cities) {
    if (lower.includes(c.name.toLowerCase())) return c;
  }
  return null;
}

function extractMetric(q: string): "temperature" | "co2" | "sealevel" | "flood" | "ice" | "permafrost" {
  const lower = q.toLowerCase();
  if (lower.includes("flood") || lower.includes("underwater") || lower.includes("淹没") || lower.includes("被淹")) return "flood";
  if (lower.includes("sea level") || lower.includes("海平面")) return "sealevel";
  if (lower.includes("co2") || lower.includes("carbon dioxide") || lower.includes("二氧化碳")) return "co2";
  if (lower.includes("ice") || lower.includes("arctic") || lower.includes("海冰") || lower.includes("北极")) return "ice";
  if (lower.includes("permafrost") || lower.includes("冻土")) return "permafrost";
  return "temperature";
}

const SCEN_NAMES: Record<string, string> = {
  ssp126: "SSP1-2.6（低排放）",
  ssp245: "SSP2-4.5（中间路线）",
  ssp370: "SSP3-7.0（中高排放）",
  ssp585: "SSP5-8.5（高排放）",
};

// ---- 回答生成 ----

export function answerClimateQuestion(question: string): QAResult {
  const scenario = extractScenario(question);
  const year = extractYear(question);
  const metric = extractMetric(question);
  const city = extractCity(question);
  const sim = runScenario(scenario, 2500);
  const idx = sim.years.indexOf(year);
  const i = idx >= 0 ? idx : sim.years.length - 1;
  const scName = SCEN_NAMES[scenario] ?? scenario;

  // 城市淹没问题
  if (metric === "flood" && city) {
    return answerFlood(question, sim, city, scenario, scName);
  }

  // 城市温度问题
  if (city && (metric === "temperature" || metric === "co2")) {
    return answerCityClimate(question, sim, city, year, scenario, scName);
  }

  // 全球指标问题
  switch (metric) {
    case "temperature": return answerTemperature(question, sim, year, scName);
    case "co2": return answerCO2(question, sim, year, scName);
    case "sealevel": return answerSeaLevel(question, sim, year, scName);
    case "ice": return answerIce(question, sim, year, scName);
    case "permafrost": return answerPermafrost(question, sim, year, scName);
    default: return answerTemperature(question, sim, year, scName);
  }
}

function answerFlood(q: string, sim: SimResult, city: CityRow, scenario: string, scName: string): QAResult {
  const slr = sim.metrics.seaLevel.total;
  const floodYear = sim.years[slr.findIndex(s => s >= city.elevation)];
  const pattern = loadWarmingPattern();
  const bands = pattern.map(p => ({ latMin: p.latMin, latMax: p.latMax, amp: p.amp }));

  // 找到城市被淹的年份
  let floodedAt: number | null = null;
  for (let i = 0; i < sim.years.length; i++) {
    if (slr[i]! >= city.elevation) { floodedAt = sim.years[i]!; break; }
  }

  const answer = floodedAt
    ? `${city.name}（高程 ${city.elevation}m，人口 ${(city.population / 1e6).toFixed(1)}M）在 ${scName} 情景下预计 **${floodedAt} 年**被海水永久淹没（海平面上升超过城市高程）。到 2100 年海平面将上升 ${sim.metrics.seaLevel.total[sim.years.indexOf(2100)]!.toFixed(2)} 米。`
    : `好消息：${city.name}（高程 ${city.elevation}m）在 ${scName} 情景下到 2500 年也不会被完全淹没。但到 2100 年海平面仍将上升 ${sim.metrics.seaLevel.total[sim.years.indexOf(2100)]!.toFixed(2)} 米，低洼沿海区域可能面临周期性洪涝。`;

  // 生成时间线数据
  const milestones = [2030, 2050, 2075, 2100, 2200, 2500];
  const data = milestones.map(y => {
    const i = sim.years.indexOf(y);
    return { year: y, value: slr[i] ?? slr[slr.length - 1]!, unit: "m", label: "海平面上升" };
  });

  return {
    question: q,
    answer,
    data,
    city: city.name,
    scenario,
    visualization: "threshold",
    sources: ["IPCC AR6 海平面投影", "GeoNames 高程数据", "本模型模拟结果"],
    followUps: floodedAt
      ? [`如何推迟 ${city.name} 的淹没？`, `${city.name} 在 SSP1-2.6 下会怎样？`, `哪些城市比 ${city.name} 更危险？`]
      : [`${city.name} 在 SSP5-8.5 下会怎样？`, `${city.name} 的温度会升多少？`, `全球哪些城市最危险？`],
  };
}

function answerCityClimate(q: string, sim: SimResult, city: CityRow, year: number, scenario: string, scName: string): QAResult {
  const i = sim.years.indexOf(year);
  const globalDT = sim.metrics.tempAnomaly[i]!;
  const pattern = loadWarmingPattern();
  const bands = pattern.map(p => ({ latMin: p.latMin, latMax: p.latMax, amp: p.amp }));
  const localDT = localDTs(globalDT, city.lat, bands);
  const futureTemp = city.tbase + localDT;
  const slr = sim.metrics.seaLevel.total[i]!;
  const flooded = isCityFlooded(city.elevation, slr);

  const answer = `${city.name}在 ${scName} 情景下 ${year} 年的气候预测：

📊 **温度**：全球升温 +${globalDT.toFixed(1)}°C，${city.name}本地升温 +${localDT.toFixed(1)}°C（含纬度放大效应），年均温从 ${city.tbase.toFixed(1)}°C 升至 **${futureTemp.toFixed(1)}°C**

🌊 **海平面**：上升 ${slr.toFixed(2)} 米${flooded ? `—— ⚠️ 城市将被淹没（高程 ${city.elevation}m）` : `（城市高程 ${city.elevation}m，暂安全）`}

 rainfall **降水**：年降水约 ${city.pbase} × (1 + 0.02 × ${globalDT.toFixed(1)}) ≈ ${Math.round(city.pbase * (1 + 0.02 * globalDT))} mm`;

  return {
    question: q,
    answer,
    data: [2030, 2050, 2075, 2100, 2200].map(y => {
      const j = sim.years.indexOf(y);
      return { year: y, value: sim.metrics.tempAnomaly[j]!, unit: "°C", label: "全球升温" };
    }),
    city: city.name,
    scenario,
    visualization: "timeline",
    sources: ["IPCC AR6", "NASA GISTEMP 校准", "Pattern Scaling 降尺度"],
    followUps: [`${city.name} 什么时候被淹？`, `换 SSP5-8.5 看看`, `${city.name} 的年降水量变化`],
  };
}

function answerTemperature(q: string, sim: SimResult, year: number, scName: string): QAResult {
  const i = sim.years.indexOf(year);
  const dT = sim.metrics.tempAnomaly[i]!;
  const cy = crossingYears(sim.years, sim.metrics.tempAnomaly);
  const thresholds = [
    { th: 1.5, year: cy.t15 }, { th: 2, year: cy.t20 }, { th: 3, year: cy.t30 },
  ].filter(t => t.year !== undefined);

  const thresholdText = thresholds.map(t => `${t.th}°C：${t.year} 年`).join("，");

  const answer = `在 ${scName} 情景下，${year} 年全球平均温度将比工业化前升高 **+${dT.toFixed(1)}°C**。

关键阈值突破时间：${thresholdText || "本情景下未突破 1.5°C"}

对比参考：
• 巴黎协定理想目标：+1.5°C
• 巴黎协定上限：+2.0°C
• 当前（2024）已升温：+1.3°C`;

  return {
    question: q,
    answer,
    data: [2030, 2040, 2050, 2060, 2075, 2100, 2200, 2500].map(y => {
      const j = sim.years.indexOf(y);
      return { year: y, value: sim.metrics.tempAnomaly[j]!, unit: "°C", label: "全球升温" };
    }),
    scenario: SCEN_NAMES.ssp245 === scName ? "ssp245" : scName,
    visualization: "timeline",
    sources: ["IPCC AR6 Table SPM.1", "本模型（G4 验收门通过）"],
    followUps: ["SSP5-8.5 会升多少？", "SSP1-2.6 能控制在 1.5°C 吗？", "海平面会升多少？"],
  };
}

function answerCO2(q: string, sim: SimResult, year: number, scName: string): QAResult {
  const i = sim.years.indexOf(year);
  const co2 = sim.metrics.co2[i]!;
  const answer = `在 ${scName} 情景下，${year} 年大气 CO₂ 浓度将达到 **${co2.toFixed(0)} ppm**。

参考：
• 工业化前（1750）：280 ppm
• 当前（2024）：423 ppm
• ${year} 年：${co2.toFixed(0)} ppm（是工业化前的 ${(co2 / 280).toFixed(1)} 倍）`;

  return {
    question: q,
    answer,
    data: [2030, 2050, 2075, 2100, 2200, 2500].map(y => {
      const j = sim.years.indexOf(y);
      return { year: y, value: sim.metrics.co2[j]!, unit: "ppm", label: "CO₂ 浓度" };
    }),
    scenario: scName,
    visualization: "timeline",
    sources: ["NOAA GML 观测数据", "Meinshausen 2020 情景路径"],
    followUps: ["温度会因此升多少？", "SSP1-2.6 的 CO₂ 会下降吗？", "海洋酸化会怎样？"],
  };
}

function answerSeaLevel(q: string, sim: SimResult, year: number, scName: string): QAResult {
  const i = sim.years.indexOf(year);
  const slr = sim.metrics.seaLevel.total[i]!;
  const thermal = sim.metrics.seaLevel.thermal[i]!;
  const glacier = sim.metrics.seaLevel.glacier[i]!;
  const ice = sim.metrics.seaLevel.iceSheet[i]!;

  const answer = `在 ${scName} 情景下，${year} 年全球海平面将比工业化前上升 **${slr.toFixed(2)} 米**。

分量分解：
• 海水热膨胀：${thermal.toFixed(2)} m（${((thermal / slr) * 100).toFixed(0)}%）
• 山地冰川：${glacier.toFixed(2)} m（${((glacier / slr) * 100).toFixed(0)}%）
• 冰盖消融：${ice.toFixed(2)} m（${((ice / slr) * 100).toFixed(0)}%）

参考：上升 1 米 = 全球约 1.5 亿人受影响`;

  return {
    question: q,
    answer,
    data: [2030, 2050, 2075, 2100, 2200, 2500].map(y => {
      const j = sim.years.indexOf(y);
      return { year: y, value: sim.metrics.seaLevel.total[j]!, unit: "m", label: "海平面上升" };
    }),
    scenario: scName,
    visualization: "timeline",
    sources: ["IPCC AR6 WG1 Ch.9", "本模型四分量分解"],
    followUps: ["哪些城市会被淹？", "SSP5-8.5 海平面会怎样？", "为什么热膨胀占比最大？"],
  };
}

function answerIce(q: string, sim: SimResult, year: number, scName: string): QAResult {
  const i = sim.years.indexOf(year);
  const ice = sim.metrics.diagnostics?.seaIceArea[i] ?? 0;

  const answer = `在 ${scName} 情景下，${year} 年北极海冰面积约 **${ice.toFixed(1)} 百万平方公里**（工业化前约 9.5M km²）。

${ice < 1 ? "⚠️ 北极夏季几乎无冰——这是本世纪最重要的气候临界点之一。航道开通、极地放大效应加剧、全球环流可能受影响。" : "海冰面积仍在但显著减少，反照率反馈正在加剧北极放大效应。"}

参考：
• 工业化前夏季最小：~7.5M km²
• 当前（2020s）夏季最小：~4.5M km²
• "无冰"阈值：< 1M km²`;

  return {
    question: q,
    answer,
    data: [2030, 2050, 2075, 2100, 2200].map(y => {
      const j = sim.years.indexOf(y);
      return { year: y, value: sim.metrics.diagnostics?.seaIceArea[j] ?? 0, unit: "M km²", label: "海冰面积" };
    }),
    scenario: scName,
    visualization: "timeline",
    sources: ["NSIDC 海冰数据", "IPCC AR6"],
    followUps: ["北极无冰有什么后果？", "AMOC 会停吗？", "冻土碳会释放多少？"],
  };
}

function answerPermafrost(q: string, sim: SimResult, year: number, scName: string): QAResult {
  const i = sim.years.indexOf(year);
  const pf = sim.metrics.permafrost?.[i] ?? 1400;
  const initial = 1400;
  const released = initial - pf;
  const pct = ((released / initial) * 100).toFixed(0);

  const answer = `在 ${scName} 情景下，${year} 年多年冻土碳库预计从 1400 GtC 减少至 **${pf.toFixed(0)} GtC**，已释放约 ${released.toFixed(0)} GtC（${pct}%）。

${released > 140 ? "⚠️ 超过 10% 已释放——碳循环正反馈回路正在启动。冻土释放的 CO₂ 和 CH₄ 会进一步加速升温。" : "释放量尚在可控范围内，正反馈效应有限。"}

参考：冻土含碳量约为当前大气碳含量的 2 倍。`;

  return {
    question: q,
    answer,
    data: [2030, 2050, 2075, 2100, 2200, 2500].map(y => {
      const j = sim.years.indexOf(y);
      return { year: y, value: sim.metrics.permafrost?.[j] ?? 1400, unit: "GtC", label: "冻土碳库" };
    }),
    scenario: scName,
    visualization: "timeline",
    sources: ["IPCC AR6 冻土碳评估", "本模型 V2 耦合"],
    followUps: ["冻土释放会加速升温多少？", "AMOC 会停吗？", "海平面会升多少？"],
  };
}

// ---- 预设问题库（SEO + 引导） ----

export const PRESET_QUESTIONS: Array<{ category: string; question: string }> = [
  { category: "温度", question: "SSP2-4.5 到 2100 年会升温多少？" },
  { category: "温度", question: "SSP5-8.5 到 2100 年会升温多少？" },
  { category: "温度", question: "SSP1-2.6 能控制在 1.5 度以内吗？" },
  { category: "温度", question: "什么时候会超过 2 度？" },
  { category: "海平面", question: "SSP2-4.5 到 2100 年海平面会升多少？" },
  { category: "海平面", question: "SSP5-8.5 到 2500 年海平面会升多少？" },
  { category: "海平面", question: "海平面上升的主要原因是什么？" },
  { category: "城市", question: "上海 2100 年会被淹没吗？" },
  { category: "城市", question: "Miami 2050 年会怎样？" },
  { category: "城市", question: "Bangkok 什么时候被淹？" },
  { category: "城市", question: "Jakarta 的洪水风险？" },
  { category: "城市", question: "Tokyo 2100 年温度会多高？" },
  { category: "CO₂", question: "SSP5-8.5 到 2100 年 CO₂ 会达到多少 ppm？" },
  { category: "CO₂", question: "SSP1-2.6 的 CO₂ 会下降吗？" },
  { category: "海冰", question: "北极什么时候夏季无冰？" },
  { category: "海冰", question: "SSP3-7.0 下 2100 年海冰面积多大？" },
  { category: "冻土", question: "冻土碳会释放多少？" },
  { category: "冻土", question: "SSP5-8.5 下 2500 年冻土碳库剩多少？" },
  { category: "对比", question: "SSP1-2.6 和 SSP5-8.5 差多少度？" },
  { category: "对比", question: "最好的情景和最差的情景差多少？" },
];
