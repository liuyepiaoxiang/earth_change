import type { Metadata } from "next";
import Content from "./Content";

export const metadata: Metadata = {
  title: "2100 与 2500 年海平面会上升多少？IPCC 预测解读",
  description: "海平面上升预测：2100 年 SSP1-2.6 约 0.4m、SSP5-8.5 约 0.8m（IPCC AR6）。哪些城市将被淹没？含互动可视化与四情景对比表。",
  alternates: { canonical: "https://earth-change.vercel.app/learn/sea-level-rise" },
};

export default function SeaLevelRisePage() {
  return <Content />;
}
