"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "../../lib/i18n";

/** /ask 页头与说明（客户端组件，随 locale 切换；SEO 元数据留在 page.tsx 服务端） */
export default function AskChrome({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const en = locale === "en";
  return (
    <>
      <header style={{ padding: "12px 20px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 4 }}>
        <Link href="/" style={{ color: "#38bdf8", textDecoration: "none", fontSize: 14 }}>🌍 {en ? "Future Earth Engine" : "未来地球引擎"}</Link>
        <span style={{ color: "#475569", margin: "0 8px" }}>|</span>
        <span style={{ color: "#94a3b8", fontSize: 13 }}>{en ? "AI Climate Q&A" : "AI 气候问答"}</span>
        <span style={{ marginLeft: "auto" }} />
        <Link href="/ask?lang=en" style={{ color: locale === "en" ? "#38bdf8" : "#64748b", fontSize: 12, textDecoration: "none", marginRight: 8 }}>EN</Link>
        <Link href="/ask?lang=zh" style={{ color: locale === "zh" ? "#38bdf8" : "#64748b", fontSize: 12, textDecoration: "none" }}>中文</Link>
      </header>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{ fontSize: 24, color: "#e0f2fe", marginBottom: 6 }}>🤖 {en ? "Ask Climate AI" : "AI 气候问答"}</h1>
        <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          {en
            ? "Ask any climate question — the system runs a NASA-calibrated climate model in real time and gives a data-driven answer. Topics: city flooding, temperature projections, CO₂, sea level, sea ice, and permafrost carbon."
            : "输入任何气候问题——系统将实时运行 NASA 校准的气候模型，给出数据驱动的回答。支持城市淹没、温度预测、CO₂ 浓度、海平面、海冰、冻土碳等问题。"}
        </p>
        {children}
        <div style={{ marginTop: 40, padding: 16, background: "#0f172a", borderRadius: 12, border: "1px solid #334155" }}>
          <h2 style={{ fontSize: 16, color: "#7dd3fc", marginBottom: 8 }}>{en ? "How This Works" : "工作原理"}</h2>
          <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}>
            {en
              ? "This AI assistant runs a real climate model (two-layer ocean energy balance + carbon cycle + sea level decomposition) calibrated against 175 years of NASA GISTEMP observations. All 2100 projections fall within IPCC AR6 assessed ranges. Unlike static websites, every answer is computed in real-time from the simulation."
              : "本问答系统运行真实的气候模型（两层海洋能量平衡 + 碳循环 + 海平面四分量分解），经 175 年 NASA GISTEMP 观测数据校准，2100 年预测全部落在 IPCC AR6 评估区间内。与静态网站不同，每个回答都由模拟实时计算得出。"}
          </p>
        </div>
      </div>
    </>
  );
}
