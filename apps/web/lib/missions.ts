/** V0.4 学习任务——纯数据 + 引擎结果判定（可追溯 SimResult） */
import type { SimResult } from "@future-earth/engine";
import type { SimResultWithUnc as SimResultWithUncLike } from "../lib/sim";
import { crossingYears, runExperiment, DEFAULT_CONTROLS } from "@future-earth/engine";

export interface PredictionOption { id: string; label: string; }
export interface Mission {
  id: string;
  title: string;
  category: "concept" | "scenario" | "city" | "impact";
  icon: string;
  intro: string;
  goal: string;
  /** 预测问题 */
  prediction: { question: string; options: PredictionOption[]; correct: string; explanation: string };
  /** 任务操作提示 */
  hint: string;
  /** 完成判定（从 sim 提取指标） */
  check: { type: "threshold" | "comparison" | "prediction"; metric: string; target?: number; unit?: string };
  /** 完成后的原因解释（三层） */
  reason: { oneLiner: string; causal: string; technical: string };
  /** 模型边界 */
  limits: string[];
  /** 推荐下一步 */
  nextMissionId?: string;
}

export const MISSIONS: Mission[] = [
  {
    id: "m1-temp-2100",
    title: "2100 年会升多少？",
    category: "concept",
    icon: "🌡️",
    intro: "SSP2-4.5 是「中间路线」情景。你觉得到 2100 年全球会升温多少？",
    goal: "预测 SSP2-4.5 在 2100 年的全球升温",
    prediction: {
      question: "SSP2-4.5 到 2100 年全球平均升温大约是多少？",
      options: [
        { id: "a", label: "1–2°C" }, { id: "b", label: "2–3°C" },
        { id: "c", label: "3–4°C" }, { id: "d", label: "4°C 以上" },
      ],
      correct: "b",
      explanation: "SSP2-4.5 的 2100 年升温约 2.7–2.9°C（IPCC AR6 最佳估计 2.7°C）。",
    },
    hint: "选择 SSP2-4.5，将时间轴拖到 2100 年，看指标栏的 ΔT。",
    check: { type: "prediction", metric: "tempAnomaly2100" },
    reason: {
      oneLiner: "CO₂ 增加后地球散热变慢，系统积累更多能量，温度随之上升。",
      causal: "排放 → CO₂ 浓度上升 → 辐射强迫增加 → 地表和海洋吸热 → 全球平均温度上升",
      technical: "两层海洋能量平衡模型（eq_11/12）：Cs·dTs/dt = F − λ·Ts − γ(Ts−Td)。碳循环（eq_15-17）将排放转化为浓度。校准参数使 2100 落在 IPCC AR6 区间（G4 门）。",
    },
    limits: ["全球平均不等于每个城市的实际温度（局地有放大系数）", "2100 年后有探索性外推标注"],
    nextMissionId: "m2-scenario-diff",
  },
  {
    id: "m2-scenario-diff",
    title: "四种未来差多少？",
    category: "scenario",
    icon: "🔀",
    intro: "四个 SSP 代表四种截然不同的未来。它们的差异有多大？",
    goal: "比较 SSP1-2.6 和 SSP5-8.5 在 2100 年的温度差",
    prediction: {
      question: "SSP1-2.6（低排放）与 SSP5-8.5（高排放）在 2100 年的升温差大约是多少？",
      options: [
        { id: "a", label: "约 1°C" }, { id: "b", label: "约 2°C" },
        { id: "c", label: "约 3°C" }, { id: "d", label: "约 5°C" },
      ],
      correct: "c",
      explanation: "SSP1-2.6 约 +1.8°C，SSP5-8.5 约 +4.9°C，差约 3°C——人类选择至关重要。",
    },
    hint: "先选 SSP1-2.6 拖到 2100 记下 ΔT，再切到 SSP5-8.5 做同样操作，计算差值。",
    check: { type: "comparison", metric: "tempDiff2100" },
    reason: {
      oneLiner: "排放路径的差异经过碳循环和气候敏感度放大后，变成显著的温度差异。",
      causal: "不同排放路径 → 不同 CO₂ 浓度 → 不同辐射强迫 → 温度差异持续扩大",
      technical: "四情景均使用浓度驱动模式（Meinshausen 2020 锚定）。浓度差异直接决定辐射强迫（eq_07-09），进而通过两层 EBM 产生温度差异。",
    },
    limits: ["情景间差异不等于政策效果的全部（未含适应与减缓成本分析）"],
    nextMissionId: "m3-slr-components",
  },
  {
    id: "m3-slr-components",
    title: "海平面从哪来？",
    category: "concept",
    icon: "🌊",
    intro: "海平面上升不是单一原因。打开「海平面分量」看四个组成部分。",
    goal: "找出 2100 年贡献最大的海平面分量",
    prediction: {
      question: "到 2100 年，以下哪个分量对海平面上升的贡献最大？",
      options: [
        { id: "a", label: "海水热膨胀" }, { id: "b", label: "山地冰川融化" },
        { id: "c", label: "格陵兰+南极冰盖" }, { id: "d", label: "陆地水储量" },
      ],
      correct: "a",
      explanation: "到 2100 年热膨胀通常贡献约 40-50%，冰盖约 30-35%，冰川约 20%，陆地水 <5%。",
    },
    hint: "打开 📊 分析 → 「海平面分量」tab，看 2100 年四色堆叠图哪个最厚。",
    check: { type: "threshold", metric: "slrThermalFraction", target: 0.35, unit: "占比" },
    reason: {
      oneLiner: "海洋吸收了地球多余的绝大部分热量，暖水膨胀是海平面上升的最大驱动力。",
      causal: "温度上升 → 海洋吸热 → 海水体积膨胀 → 海平面上升（同时冰冻圈贡献叠加）",
      technical: "热膨胀（eq_14）：dS_th/dt = k_th·γ(Ts−Td)。冰川（eq_26）：度日模型。冰盖（eq_27）：简化 SMB。四分量加总（eq_31）。",
    },
    limits: ["简化冰盖不含快速动力学断裂", "未含区域海平面差异（如洋流导致的东西差异）"],
    nextMissionId: "m4-experiment",
  },
  {
    id: "m4-experiment",
    title: "改变未来",
    category: "impact",
    icon: "🧪",
    intro: "现在是你的实验室：调整减排参数，看能否改变 2100 年的升温。",
    goal: "用实验控制项让 2100 年升温低于 2°C",
    prediction: {
      question: "如果排放强度降到基准的 0.6 倍，且 2050 年实现净零，2100 年升温大约会降低多少？",
      options: [
        { id: "a", label: "约 0.3°C" }, { id: "b", label: "约 0.8°C" },
        { id: "c", label: "约 1.5°C" }, { id: "d", label: "约 2.5°C" },
      ],
      correct: "b",
      explanation: "强劲减排可降低约 0.7-1.0°C，但海洋热惯性意味着已积累的升温不会立即消失。",
    },
    hint: "点击 🧪 实验，设置排放强度 0.6、净零年份 2050，然后看指标栏 ΔT。",
    check: { type: "threshold", metric: "expDT2100", target: 2.0, unit: "°C" },
    reason: {
      oneLiner: "减少排放能显著降低未来升温，但海洋热惯性会延缓降温。",
      causal: "排放降低 → CO₂ 浓度增速放缓 → 辐射强迫增幅减少 → 温度峰值下降（但海洋已吸收的热量释放缓慢）",
      technical: "实验模式使用排放驱动（碳循环自由运行）。与 SSP 浓度驱动（AR6 锚定）形成诚实对照。海洋滞后由两层 EBM 的深层热容量 Cd（~105 W·yr/m²/K）决定。",
    },
    limits: ["教育性实验，未经 AR6 区间锚定", "不含经济成本和政策可行性分析"],
  },
];

/** 从 SimResult 提取任务判定指标 */
export function extractMissionMetric(sim: SimResult | SimResultWithUncLike, metric: string): number | null {
  const i2100 = sim.years.indexOf(2100);
  if (i2100 < 0) return null;
  switch (metric) {
    case "tempAnomaly2100": return sim.metrics.tempAnomaly[i2100]!;
    case "slrThermalFraction": {
      const total = sim.metrics.seaLevel.total[i2100]!;
      return total > 0 ? sim.metrics.seaLevel.thermal[i2100]! / total : null;
    }
    case "expDT2100": return sim.metrics.tempAnomaly[i2100]!;
    default: return null;
  }
}

/** 判定任务是否完成 */
export function checkMission(mission: Mission, sim: SimResult | SimResultWithUncLike): { done: boolean; value: string } {
  switch (mission.check.metric) {
    case "tempDiff2100": {
      // 需要两个情景——在 UI 层处理，这里返回提示
      return { done: false, value: "需要比较两个情景——请分别查看 SSP1-2.6 和 SSP5-8.5 的 2100 年 ΔT" };
    }
    case "prediction": {
      return { done: true, value: "完成预测后查看结果" };
    }
    case "slrThermalFraction": {
      const v = extractMissionMetric(sim, mission.check.metric);
      return { done: v !== null && v > 0.3, value: v !== null ? `热膨胀占比 ${(v * 100).toFixed(0)}%` : "—" };
    }
    case "expDT2100": {
      const v = extractMissionMetric(sim, mission.check.metric);
      return { done: v !== null && v < (mission.check.target ?? 2), value: v !== null ? `ΔT ${v.toFixed(2)}°C` : "—" };
    }
    default: return { done: false, value: "—" };
  }
}
