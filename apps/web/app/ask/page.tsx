import type { Metadata } from "next";
import ClimateQA from "../../components/ClimateQA";
import AskChrome from "./AskChrome";

export const metadata: Metadata = {
  title: "Climate Q&A — Get Answers From Real Climate Model Simulations",
  description: "Ask any climate question and get instant answers powered by our NASA-calibrated climate model. Sea level rise, city flooding, temperature projections — all interactive.",
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
