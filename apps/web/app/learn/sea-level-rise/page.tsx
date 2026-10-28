import type { Metadata } from "next";
import Content from "./Content";

export const metadata: Metadata = {
  title: "How Much Will Sea Levels Rise by 2100 and 2500? IPCC Projections",
  description: "Sea level rise projections by 2100: SSP1-2.6 = 0.4m, SSP5-8.5 = 0.8m. See which cities will be underwater with interactive visualization. IPCC AR6 data.",
  alternates: { canonical: "https://earth-change.vercel.app/learn/sea-level-rise" },
};

export default function SeaLevelRisePage() {
  return <Content />;
}
