/** V0.4 分享文案生成——自动构造包含上下文的社交分享文字（docs/12 §8.6） */
import type { SimResult, CrossingYears } from "@future-earth/engine";
import { crossingYears } from "@future-earth/engine";

export interface ShareTextOptions {
  sim: Pick<SimResult, "scenario" | "metrics" | "years" | "metadata" | "paramsFingerprint">;
  year: number;
  cityName?: string;
  compareScenario?: string;
  compareMetrics?: { dT: number; slr: number };
  /** 分享文案语言（默认中文） */
  locale?: "zh" | "en";
}

export function generateShareText(opts: ShareTextOptions): string {
  const { sim, year } = opts;
  const en = opts.locale === "en";
  const i = sim.years.indexOf(year);
  if (i < 0) return "";
  const dT = sim.metrics.tempAnomaly[i]!;
  const slr = sim.metrics.seaLevel.total[i]!;
  const cy = crossingYears(sim.years, sim.metrics.tempAnomaly);
  const isExp = "experiment" in sim;

  if (opts.cityName) {
    return en
      ? `🌍 I checked ${opts.cityName} in ${year} under ${sim.scenario} on Future Earth: global warming +${dT.toFixed(1)}°C, sea level +${slr.toFixed(2)}m. Drag the timeline to see cities change → https://earth-change.vercel.app`
      : `🌍 我在 Future Earth 上查看了${opts.cityName}在 ${sim.scenario} 情景下 ${year} 年的状态：全球升温 +${dT.toFixed(1)}°C，海平面 +${slr.toFixed(2)}m。拖动时间轴查看城市变化 → https://earth-change.vercel.app`;
  }

  if (opts.compareScenario && opts.compareMetrics) {
    const dDT = dT - opts.compareMetrics.dT;
    const dSLR = slr - opts.compareMetrics.slr;
    return en
      ? `🌍 I compared ${sim.scenario} vs ${opts.compareScenario}. By ${year} the two paths differ by ~${Math.abs(dDT).toFixed(1)}°C warming and ~${Math.abs(dSLR).toFixed(2)}m sea level.${dDT < 0 ? " Choices matter." : ""} Keep exploring → https://earth-change.vercel.app`
      : `🌍 我比较了 ${sim.scenario} 和 ${opts.compareScenario}。到 ${year} 年，两条路径的全球升温相差约 ${Math.abs(dDT).toFixed(1)}°C，海平面相差约 ${Math.abs(dSLR).toFixed(2)}m。${dDT < 0 ? "选择很重要。" : ""}继续探索 → https://earth-change.vercel.app`;
  }

  const threshold = cy.t15 ? (en ? `1.5°C first crossed in ${cy.t15}` : `已首次超过 1.5°C（${cy.t15} 年）`) : "";
  return en
    ? `🌍 ${isExp ? "My experiment" : sim.scenario} in ${year}: global warming +${dT.toFixed(1)}°C, sea level +${slr.toFixed(2)}m${threshold ? `, ${threshold}` : ""}.${sim.metadata.driverMode === "emissions-driven" ? " (educational experiment)" : ""} Drag the timeline to watch Earth change → https://earth-change.vercel.app`
    : `🌍 ${isExp ? "我的实验" : sim.scenario} 情景下 ${year} 年：全球升温 +${dT.toFixed(1)}°C，海平面 +${slr.toFixed(2)}m${threshold ? "，" + threshold : ""}。${sim.metadata.driverMode === "emissions-driven" ? "（教育性实验）" : ""}拖动时间轴看地球变化 → https://earth-change.vercel.app`;
}

/** X/Twitter 分享 URL */
export function xShareUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
