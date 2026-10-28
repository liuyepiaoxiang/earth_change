/** V4.1 里程碑事件——让时间轴「会说话」（纯派生函数，零耦合） */
import type { SimLike } from "./grid.js";
import { loadCities } from "@future-earth/data";
import { crossingYears } from "./thresholds.js";

export interface MilestoneEvent {
  year: number;
  icon: string;
  title: string;
  description: string;
  /** 英文平行文案（可选）——UI 层 locale=en 时优先使用 */
  titleEn?: string;
  descriptionEn?: string;
  category: "temperature" | "sea" | "ice" | "carbon" | "impact" | "ecosystem";
}

const at = (sim: SimLike, year: number, series: number[]): number => {
  const i = sim.years.indexOf(year);
  return series[i >= 0 ? i : sim.years.length - 1]!;
};

export function milestoneEvents(sim: SimLike): MilestoneEvent[] {
  const evts: MilestoneEvent[] = [];
  const cy = crossingYears(sim.years, sim.metrics.tempAnomaly);

  // 温度阈值
  const temps: Array<[keyof typeof cy, number, string, string, string]> = [
    ["t15", 1.5, "🌡️", "1.5°C 阈值突破", "1.5°C threshold crossed"],
    ["t20", 2.0, "🔥", "2°C 阈值突破", "2°C threshold crossed"],
    ["t30", 3.0, "🚨", "3°C 阈值突破", "3°C threshold crossed"],
  ];
  for (const [key, th, icon, title, titleEn] of temps) {
    const y = cy[key];
    if (y !== undefined) evts.push({
      year: y, icon, title, titleEn,
      description: `全球升温首次达到 ${th}°C（巴黎协定${th === 1.5 ? "理想" : th === 2 ? "上限" : "远超"}目标）`,
      descriptionEn: `Global warming reaches ${th}°C for the first time (Paris Agreement ${th === 1.5 ? "ideal goal" : th === 2 ? "upper limit" : "far beyond"})`,
      category: "temperature",
    });
  }

  // 海平面里程碑
  const slr = sim.metrics.seaLevel.total;
  const slrMs: Array<[number, string, string, string]> = [
    [0.5, "🌊", "海平面上升 0.5m", "Sea level +0.5m"],
    [1.0, "🌊", "海平面上升 1m", "Sea level +1m"],
    [2.0, "🌊", "海平面上升 2m", "Sea level +2m"],
    [5.0, "🌊", "海平面上升 5m", "Sea level +5m"],
  ];
  for (const [th, icon, title, titleEn] of slrMs) {
    const y = slr.findIndex((v) => v >= th);
    if (y >= 0 && sim.years[y]! > 2025) evts.push({
      year: sim.years[y]!, icon, title, titleEn,
      description: `全球平均海平面较工业化前上升 ${th}m——多个低洼沿海城市面临永久性淹没`,
      descriptionEn: `Global mean sea level rises ${th}m above pre-industrial — many low-lying coastal cities face permanent inundation`,
      category: "sea",
    });
  }

  // 海冰
  if (sim.metrics.diagnostics?.seaIceArea) {
    const ice = sim.metrics.diagnostics.seaIceArea;
    const yIce = ice.findIndex((v) => v < 1.0);
    if (yIce >= 0 && sim.years[yIce]! > 2025) evts.push({
      year: sim.years[yIce]!, icon: "🧊", title: "北极夏季几乎无冰", titleEn: "Nearly ice-free Arctic summer",
      description: "海冰面积降至 100 万 km² 以下——北极航道可能开通，极地生态剧变",
      descriptionEn: "Sea ice extent falls below 1M km² — Arctic shipping routes may open; polar ecosystems transform",
      category: "ice",
    });
  }

  // 冻土碳
  if (sim.metrics.permafrost) {
    const pf = sim.metrics.permafrost;
    const y10 = pf.findIndex((v) => v < 1260); // 释放 >10%
    if (y10 >= 0 && sim.years[y10]! > 2025) evts.push({
      year: sim.years[y10]!, icon: "🫧", title: "冻土碳加速释放", titleEn: "Permafrost carbon release accelerating",
      description: "多年冻土碳库已释放 10% 以上——正反馈回路启动",
      descriptionEn: "Over 10% of the permafrost carbon pool has been released — positive feedback loop engaged",
      category: "carbon",
    });
    const y30 = pf.findIndex((v) => v < 980); // 释放 >30%
    if (y30 >= 0 && sim.years[y30]! > 2025) evts.push({
      year: sim.years[y30]!, icon: "⚠️", title: "冻土碳大规模释放", titleEn: "Large-scale permafrost carbon release",
      description: "冻土碳库释放超过 30%——碳循环正反馈显著",
      descriptionEn: "Over 30% of the permafrost carbon pool released — significant carbon-cycle feedback",
      category: "carbon",
    });
  }

  // 城市淹没（首城 / 百万人口首城）
  try {
    const cities = loadCities();
    const firstFlood = cities.findIndex((c) => c.elevationSource !== "unknown" && c.elevation <= slr[0]!);
    for (const [th, icon, desc, descEn] of [
      [0.5, "🏙️", "首个沿海大城市被淹", "First major coastal city flooded"],
      [1.0, "🌃", "首个百万人口城市被淹", "First million-population city flooded"],
    ] as const) {
      const idx = slr.findIndex((v) => v >= th);
      if (idx >= 0 && sim.years[idx]! > 2025) {
        const flooded = cities.filter((c) => c.elevationSource !== "unknown" && c.elevation <= th);
        const big = flooded.filter((c) => c.population >= 1_000_000);
        if (th === 0.5 && flooded.length > 0) evts.push({
          year: sim.years[idx]!, icon, title: desc, titleEn: descEn,
          description: `${flooded[0]!.name}（${flooded[0]!.country}，高程 ${flooded[0]!.elevation}m）被永久淹没——共 ${flooded.length} 城受影响`,
          descriptionEn: `${flooded[0]!.name} (${flooded[0]!.country}, elevation ${flooded[0]!.elevation}m) permanently flooded — ${flooded.length} cities affected`,
          category: "impact",
        });
        if (th === 1.0 && big.length > 0) evts.push({
          year: sim.years[idx]!, icon, title: desc, titleEn: descEn,
          description: `${big[0]!.name}（${big[0]!.country}，人口 ${(big[0]!.population / 1e6).toFixed(1)}M）永久淹没——共 ${big.length} 个百万人口城市受影响`,
          descriptionEn: `${big[0]!.name} (${big[0]!.country}, pop. ${(big[0]!.population / 1e6).toFixed(1)}M) permanently flooded — ${big.length} million+ cities affected`,
          category: "impact",
        });
      }
    }
  } catch { /* 城市数据不可用时跳过 */ }

  // pH
  if (sim.metrics.co2) {
    const ph78 = sim.metrics.co2.findIndex((c) => 8.25 - 0.3 * Math.log2(c / 280) < 7.8);
    if (ph78 >= 0 && sim.years[ph78]! > 2025) evts.push({
      year: sim.years[ph78]!, icon: "🐠", title: "海洋酸化严重", titleEn: "Severe ocean acidification",
      description: "海洋 pH 降至 7.8 以下——珊瑚礁生态系统面临大规模崩溃",
      descriptionEn: "Ocean pH falls below 7.8 — coral reef ecosystems face large-scale collapse",
      category: "ecosystem",
    });
  }

  return evts.sort((a, b) => a.year - b.year);
}
