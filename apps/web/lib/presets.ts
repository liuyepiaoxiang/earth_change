/** A3 剧本一键卡：四个反事实预设（全部 ExperimentControls 合法域，一键即跑可细调）。
 *  火山冬（无负强迫通道）/AMOC 崩溃（tipping 纯诊断）/排放×2（schema 钳 1.5）不可行——见 docs/12。 */
import type { ExperimentControls } from "@future-earth/engine";

export interface Preset {
  id: string;
  icon: string;
  /** zh/en 双语：名称与一句话说明 */
  name: [string, string];
  desc: [string, string];
  controls: ExperimentControls;
}

export const PRESETS: Preset[] = [
  {
    id: "fossil-forever",
    icon: "💀",
    name: ["化石永动", "Fossil Forever"],
    desc: ["排放拉满 ×1.5、2100 年才开始减排、碳汇退化", "Emissions ×1.5, mitigation delayed to 2100, weak sinks"],
    controls: { emissionScale: 1.5, declineStart: 2100, netZeroYear: 2200, methanePath: "high", lulucPath: "high", sinkCapacity: "conservative", coastalDefense: "none" },
  },
  {
    id: "net-zero-2050",
    icon: "🌱",
    name: ["2050 净零", "Net Zero 2050"],
    desc: ["即刻减排、2050 达净零、甲烷/LUC 全低线、碳汇增强", "Act now, net zero by 2050, low CH4/LUC, enhanced sinks"],
    controls: { emissionScale: 1, declineStart: 2025, netZeroYear: 2050, methanePath: "low", lulucPath: "low", sinkCapacity: "enhanced", coastalDefense: "none" },
  },
  {
    id: "emergency-brake",
    icon: "🚑",
    name: ["极限急救", "Emergency Brake"],
    desc: ["排放砍半、2030 净零——物理上最激进的刹车", "Halve emissions, net zero by 2030 — the most aggressive brake"],
    controls: { emissionScale: 0.5, declineStart: 2025, netZeroYear: 2030, methanePath: "low", lulucPath: "low", sinkCapacity: "enhanced", coastalDefense: "none" },
  },
  {
    id: "nature-saves",
    icon: "🌳",
    name: ["自然发力", "Nature Saves"],
    desc: ["人类按中间路线走，但碳汇与土地利用全力配合", "Middle-road humans, but maxed-out sinks and land use"],
    controls: { emissionScale: 1, declineStart: 2040, netZeroYear: 2075, methanePath: "medium", lulucPath: "low", sinkCapacity: "enhanced", coastalDefense: "none" },
  },
];
