/** 猜猜看核心逻辑（A1 进站弹层与 GuessGame 共用）——纯函数，从 GuessGame.tsx 提取。
 *  同时修复原 makeRound 的 bug：scenario 随机抽取但不影响数据，仅文案用——现取 sim 真实 scenario。 */
import type { SimResultWithUnc } from "./sim";

export interface Round { targetYear: number; targetDT: number; scenario: string; label: string }

export const SCEN_NAME: Record<"zh" | "en", Record<string, string>> = {
  zh: { ssp126: "SSP1-2.6（低排放）", ssp245: "SSP2-4.5（中间路线）", ssp370: "SSP3-7.0（中高排放）", ssp585: "SSP5-8.5（高排放）" },
  en: { ssp126: "SSP1-2.6 (Low emissions)", ssp245: "SSP2-4.5 (Middle road)", ssp370: "SSP3-7.0 (High emissions)", ssp585: "SSP5-8.5 (Very high emissions)" },
};

const CANDIDATE_YEARS = [2030, 2040, 2050, 2060, 2075, 2090, 2100, 2120, 2150];

/** 经典玩法：随机抽一年，玩家猜「哪个年份达到给定 ΔT」 */
export function makeRound(sim: SimResultWithUnc, locale: "zh" | "en"): Round {
  const y = CANDIDATE_YEARS[Math.floor(Math.random() * CANDIDATE_YEARS.length)]!;
  const i = sim.years.indexOf(y);
  const dT = sim.metrics.tempAnomaly[i] ?? 0;
  const sc = sim.scenario;
  return { targetYear: y, targetDT: dT, scenario: sc, label: `${SCEN_NAME[locale]![sc] ?? sc} ${locale === "en" ? y : `${y} 年`}` };
}

/** 偏差分档（ GuessGame 判分口径）：返回 0–4 档 */
export function gradeDiff(diff: number): 0 | 1 | 2 | 3 | 4 {
  return diff < 0.1 ? 0 : diff < 0.3 ? 1 : diff < 0.6 ? 2 : diff < 1.5 ? 3 : 4;
}
export const POINTS = [100, 70, 40, 15, 0] as const;
export const MEDALS = ["🏆", "🥇", "🥈", "🥉", "😅"] as const;
export const DIFFS: Record<"zh" | "en", string[]> = {
  zh: ["完美！", "非常接近！", "还不错", "有点偏", "差很远..."],
  en: ["Perfect!", "Very close!", "Not bad", "A bit off", "Way off..."],
};

/** A1 反转玩法：给定年份（默认 2100），玩家猜「全球升温多少 °C」——对数值无直觉 → 惊讶感更强 */
export interface TempQuestion { year: number; actualDT: number; min: number; max: number }
export function tempQuestion(sim: SimResultWithUnc, year = 2100): TempQuestion {
  const i = sim.years.indexOf(year);
  const actualDT = i >= 0 ? (sim.metrics.tempAnomaly[i] ?? 0) : 0;
  return { year, actualDT, min: 0, max: 6 };
}
