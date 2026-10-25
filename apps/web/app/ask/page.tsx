import type { Metadata } from "next";
import Link from "next/link";
import ClimateQA from "../../components/ClimateQA";

export const metadata: Metadata = {
  title: "Ask Climate AI — Get Answers From Real Climate Model Simulations",
  description: "Ask any climate question and get instant answers powered by our NASA-calibrated climate model. Sea level rise, city flooding, temperature projections — all interactive.",
  alternates: { canonical: "https://earth-change.vercel.app/ask" },
};

export default function AskPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#05070f", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ padding: "12px 20px", borderBottom: "1px solid #1e293b" }}>
        <Link href="/" style={{ color: "#38bdf8", textDecoration: "none", fontSize: 14 }}>🌍 未来地球引擎</Link>
        <span style={{ color: "#475569", margin: "0 8px" }}>|</span>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>AI 气候问答</span>
      </header>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{ fontSize: 24, color: "#e0f2fe", marginBottom: 6 }}>🤖 Ask Climate AI</h1>
        <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          输入任何气候问题——系统将实时运行 NASA 校准的气候模型，给出数据驱动的回答。
          支持城市淹没、温度预测、CO₂ 浓度、海平面、海冰、冻土碳等问题。
        </p>

        <ClimateQA />

        <div style={{ marginTop: 40, padding: 16, background: "#0f172a", borderRadius: 12, border: "1px solid #334155" }}>
          <h2 style={{ fontSize: 16, color: "#7dd3fc", marginBottom: 8 }}>How This Works</h2>
          <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}>
            This AI assistant runs a real climate model (two-layer ocean energy balance + carbon cycle + sea level decomposition)
            calibrated against 175 years of NASA GISTEMP observations. All 2100 projections fall within IPCC AR6 assessed ranges.
            Unlike static websites, every answer is computed in real-time from the simulation.
          </p>
        </div>
      </div>
    </main>
  );
}
