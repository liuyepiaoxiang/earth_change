/** V4.0 临界点诊断——AMOC 减弱 / 冰盖快速损失 / 冻土碳释放（纯诊断式，U-04/U-05）
 *  口径：这些是「文献触发条件的监测器」，不是临界点模型本身。 */
import type { SimLike } from "./grid.js";

export interface TippingStatus {
  name: string;
  triggered: boolean;
  triggerCondition: string;
  currentLevel: string;
  validRange: string;
  warning: string | null;
  /** U-05：区分真实临界点信号与数值发散 */
  isPhysicalSignal: boolean;
}

const at = (sim: SimLike, year: number, series: number[]): number => {
  const i = sim.years.indexOf(year);
  return series[i >= 0 ? i : sim.years.length - 1]!;
};

/** AMOC 减弱诊断：全球升温 > 2°C 开始减弱，> 4°C 显著减弱（AR6 量级） */
export function amocStatus(sim: SimLike, year: number): TippingStatus {
  const dT = at(sim, year, sim.metrics.tempAnomaly);
  const triggered = dT >= 4;
  return {
    name: "AMOC 减弱",
    triggered,
    triggerCondition: "全球 ΔT ≥ 4°C（AR6 低置信度临界点估计）",
    currentLevel: dT < 2 ? "稳定" : dT < 3 ? "早期减弱" : dT < 4 ? "明显减弱" : "显著减弱",
    validRange: "全球升温诊断（非海洋环流模型）",
    warning: triggered ? "AMOC 可能已跨越临界点——大西洋翻转环流显著减弱" : null,
    isPhysicalSignal: dT < 10,
  };
}

/** 格陵兰冰盖快速损失：表面质量平衡持续负 + 温度阈值 */
export function grgLosing(sim: SimLike, year: number): TippingStatus {
  const dT = at(sim, year, sim.metrics.tempAnomaly);
  const slr = at(sim, year, sim.metrics.seaLevel.iceSheet);
  const triggered = dT >= 2.5 && slr > 0.3; // ~0.3m 冰盖贡献 + >2.5°C
  return {
    name: "格陵兰冰盖快速损失",
    triggered,
    triggerCondition: "ΔT ≥ 2.5°C 且冰盖贡献 ≥ 0.3m SLE",
    currentLevel: slr < 0.1 ? "稳定" : slr < 0.3 ? "缓慢消融" : "快速损失中",
    validRange: "简化 SMB 诊断（非三维冰流模型）",
    warning: triggered ? "格陵兰冰盖可能已进入不可逆消融" : null,
    isPhysicalSignal: dT < 12,
  };
}

/** 冻土碳释放：冻土库显著减少 + 温度持续升高 */
export function permafrostBomb(sim: SimLike, year: number): TippingStatus {
  const dT = at(sim, year, sim.metrics.tempAnomaly);
  const pf = at(sim, year, sim.metrics.permafrost ?? [1400]);
  const initial = 1400;
  const lost = (initial - pf) / initial;
  const triggered = lost > 0.3 && dT > 3;
  return {
    name: "冻土碳加速释放",
    triggered,
    triggerCondition: "冻土碳库减少 ≥ 30% 且 ΔT > 3°C",
    currentLevel: lost < 0.05 ? "稳定" : lost < 0.15 ? "缓慢融化" : lost < 0.3 ? "加速释放" : "大规模释放",
    validRange: "全球聚合箱（非空间冻土模型）",
    warning: triggered ? "冻土碳可能形成自加速反馈回路" : null,
    isPhysicalSignal: Number.isFinite(pf) && pf >= 0,
  };
}

/** 汇总 + U-05 筛查（剔除数值发散误判） */
export function allTippingPoints(sim: SimLike, year: number): TippingStatus[] {
  const all = [amocStatus(sim, year), grgLosing(sim, year), permafrostBomb(sim, year)];
  return all.filter((t) => t.isPhysicalSignal); // U-05
}
