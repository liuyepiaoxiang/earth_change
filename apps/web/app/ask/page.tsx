import type { Metadata } from "next";
import ClimateQA from "../../components/ClimateQA";
import AskChrome from "./AskChrome";

export const metadata: Metadata = {
  title: "Climate Q&A — Answers From Real Climate Model Simulations",
  description: "Rule-based Q&A over our NASA-calibrated climate model: sea level rise, city flooding, temperature projections, CO₂, sea ice, and permafrost. Interactive, real-time.",
  alternates: { canonical: "https://earth-change.vercel.app/ask" },
};

export default function AskPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#05070f", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <AskChrome>
        <ClimateQA />
      </AskChrome>
    </main>
  );
}
