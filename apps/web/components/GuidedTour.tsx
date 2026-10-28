"use client";
/** V0.4 导览模式——三个预设问题入口 + 概念卡（docs/12 §5.1 + §6.4；双语） */
import { useState } from "react";
import { useI18n } from "../lib/i18n";

const card: React.CSSProperties = { border: "1px solid #334155", borderRadius: 12, padding: 16, background: "#0f172a", cursor: "pointer", transition: "border-color 0.2s" };
const conceptCard: React.CSSProperties = { ...card, cursor: "default" };
const q: React.CSSProperties = { fontSize: 15, color: "#e0f2fe", fontWeight: "bold", marginBottom: 6 };
const a: React.CSSProperties = { fontSize: 16, color: "#94a3b8", lineHeight: 1.5 };

interface Concept { icon: string; term: string; termEn: string; define: string; defineEn: string; analogy: string; analogyEn: string; position: string; positionEn: string; experiment: string; experimentEn: string; misread: string; misreadEn: string }
const CONCEPTS: Concept[] = [
  {
    icon: "🏭", term: "排放路径", termEn: "Emissions pathway",
    define: "人类每年向大气排放多少 CO₂ 的未来方案。", defineEn: "A plan for how much CO₂ humanity emits each year.",
    analogy: "像水龙头的开度——决定水位（浓度）上升的速度。", analogyEn: "Like a faucet's flow — it sets how fast the water level (concentration) rises.",
    position: "情景输入（SSP / 实验室可调）", positionEn: "Scenario input (SSP / adjustable in the Lab)",
    experiment: "在实验室调低排放强度到 0.6 倍，看 CO₂ 曲线变化。", experimentEn: "In the Lab, lower emission intensity to 0.6× and watch the CO₂ curve change.",
    misread: "排放减少 ≠ 浓度立即下降（累积效应）。", misreadEn: "Lower emissions ≠ immediate CO₂ decline (accumulation effect).",
  },
  {
    icon: "🌡️", term: "辐射强迫", termEn: "Radiative forcing",
    define: "温室气体改变地球能量收支的强度（W/m²）。", defineEn: "How strongly greenhouse gases alter Earth's energy budget (W/m²).",
    analogy: "像给地球盖了一层越来越厚的毯子。", analogyEn: "Like wrapping Earth in an ever-thicker blanket.",
    position: "方程 eq_07–09（CO₂/CH₄/N₂O + 其他）", positionEn: "Equations eq_07–09 (CO₂/CH₄/N₂O + others)",
    experiment: "打开「为什么会这样」看当前年的强迫分解。", experimentEn: 'Open "Why?" to see the forcing breakdown for the current year.',
    misread: "强迫大 ≠ 温度立刻高（海洋吸热延缓）。", misreadEn: "Higher forcing ≠ instant warming (the ocean delays heat uptake).",
  },
  {
    icon: "🌊", term: "两层海洋模型", termEn: "Two-layer ocean model",
    define: "海洋分表层（快响应）和深层（慢响应）两层。", defineEn: "The ocean is split into a fast-responding surface layer and a slow deep layer.",
    analogy: "像一杯热茶——表面凉得快，杯底还是热的。", analogyEn: "Like a cup of tea — the surface cools fast while the bottom stays hot.",
    position: "方程 eq_11/12（RK4 求解）", positionEn: "Equations eq_11/12 (RK4 integration)",
    experiment: "对比观测对照——看海洋如何延缓 20 世纪的升温。", experimentEn: "Check Obs vs Model — see how the ocean delayed 20th-century warming.",
    misread: "海洋延缓 ≠ 消除升温——深海最终也会变暖。", misreadEn: "Ocean delay ≠ no warming — the deep ocean warms eventually too.",
  },
  {
    icon: "🧊", term: "海平面四分量", termEn: "Sea level, 4 components",
    define: "热膨胀 + 冰川 + 冰盖 + 陆地水 = 总海平面上升。", defineEn: "Thermal expansion + glaciers + ice sheets + land water = total sea level rise.",
    analogy: "四个水龙头同时往浴缸里放水，速度各不同。", analogyEn: "Four faucets filling the same bathtub at different rates.",
    position: "方程 eq_14/26/27/31", positionEn: "Equations eq_14/26/27/31",
    experiment: "打开「海平面分量」看四色堆叠图。", experimentEn: 'Open "Sea Level" to see the four-color stacked chart.',
    misread: "海平面不会因减排立即停止上升（冰冻圈滞后）。", misreadEn: "Sea level won't stop rising the moment emissions fall (cryosphere lag).",
  },
  {
    icon: "📊", term: "参数不确定性", termEn: "Parameter uncertainty",
    define: "模型参数不精确导致的预测区间（p10–p90）。", defineEn: "The prediction range (p10–p90) caused by imprecise model parameters.",
    analogy: "像天气预报说「降水概率 60%」而不是「一定下雨」。", analogyEn: 'Like a forecast saying "60% chance of rain" rather than "it will rain".',
    position: "蒙特卡洛先验采样（±区间按钮）", positionEn: "Monte Carlo prior sampling (±Range button)",
    experiment: "点击「±区间」开启 MC，看温度曲线的阴影带。", experimentEn: 'Click "±Range" to run MC and see the shaded band on the temperature curve.',
    misread: "MC 区间 ≠ IPCC 共识区间（口径已在结果说明中标注）。", misreadEn: "MC range ≠ IPCC consensus range (definitions noted in About).",
  },
  {
    icon: "🔍", term: "模式缩放降尺度", termEn: "Pattern scaling",
    define: "全球平均温度 → 城市温度的纬度/陆海差异换算。", defineEn: "Converting global mean temperature to city level via latitude/land-sea patterns.",
    analogy: "全球均值是平均分，城市是每个学生的分数。", analogyEn: "The global mean is the class average; cities are individual students' scores.",
    position: "方程 eq_51（Pattern Scaling）", positionEn: "Equation eq_51 (Pattern Scaling)",
    experiment: "对比上海（沿海）和新德里（内陆）的本地升温。", experimentEn: "Compare local warming in Shanghai (coastal) vs New Delhi (inland).",
    misread: "城市温度 ≠ 当天天气（这是气候态变化，不是天气预报）。", misreadEn: "City temperature ≠ today's weather (climate-state change, not a forecast).",
  },
];

interface Tour { icon: string; title: string; titleEn: string; desc: string; descEn: string; href: string; mission: string | null }
const TOURS: Tour[] = [
  { icon: "🌍", title: "2100 年四种未来有什么差异？", titleEn: "How do the four futures of 2100 differ?", desc: "比较四个 SSP 的温度、CO₂ 和海平面差异", descEn: "Compare temperature, CO₂ and sea level across the four SSPs", href: "/?scenario=ssp245&year=2100", mission: "m2-scenario-diff" },
  { icon: "🏙️", title: "我的城市会怎样？", titleEn: "What happens to my city?", desc: "搜索或点击城市，看本地升温、降水、群系和淹没判定", descEn: "Search or click a city for local warming, precipitation, biome and flooding", href: "/?scenario=ssp245&year=2100", mission: null },
  { icon: "⏱️", title: "提前减排能改变多少？", titleEn: "How much does earlier mitigation change?", desc: "用实验室调整减排时间，看 2100 年差异", descEn: "Use the Lab to shift mitigation timing and see the 2100 difference", href: "/?scenario=ssp245&year=2100", mission: "m4-experiment" },
];

export default function GuidedTour() {
  const { locale } = useI18n();
  const en = locale === "en";
  const [openConcept, setOpenConcept] = useState<number | null>(null);
  return (
    <div data-testid="guided-tour" style={{ padding: "20px 16px", maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ color: "#e0f2fe", textAlign: "center", marginBottom: 6 }}>{en ? "What do you want to explore?" : "你想探索哪个问题？"}</h2>
      <p style={{ color: "#64748b", textAlign: "center", fontSize: 16, marginBottom: 24 }}>{en ? "Pick an entry point and start your future-Earth experiment" : "选择一个入口，开始你的未来地球实验"}</p>

      {/* 三个预设入口 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 32 }}>
        {TOURS.map((t) => (
          <a key={t.title} href={t.href + (en ? "&lang=en" : "")} style={{ ...card, textDecoration: "none", display: "block" }}>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>{t.icon}</div>
            <div style={{ ...q, textAlign: "center" }}>{en ? t.titleEn : t.title}</div>
            <div style={{ ...a, textAlign: "center" }}>{en ? t.descEn : t.desc}</div>
          </a>
        ))}
      </div>

      {/* 概念卡库 */}
      <h3 style={{ color: "#94a3b8", fontSize: 16, marginBottom: 12, borderBottom: "1px solid #1e293b", paddingBottom: 8 }}>
        📚 {en ? "Core Concepts (click to expand)" : "核心概念（点击展开）"}
      </h3>
      <div style={{ display: "grid", gap: 8 }}>
        {CONCEPTS.map((c, i) => (
          <div key={c.term} style={conceptCard} onClick={() => setOpenConcept(openConcept === i ? null : i)}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
              <b style={{ color: "#e0f2fe", fontSize: 15, flex: 1 }}>{en ? c.termEn : c.term}</b>
              <span style={{ color: "#475569", fontSize: 15 }}>{openConcept === i ? "▼" : "▶"}</span>
            </div>
            {openConcept === i && (
              <div style={{ marginTop: 10, paddingLeft: 30, display: "grid", gap: 6 }}>
                <p style={{...a, color: "#cbd5e1"}}><b>{en ? "Definition: " : "定义："}</b>{en ? c.defineEn : c.define}</p>
                <p style={a}><b>{en ? "Analogy: " : "类比："}</b>{en ? c.analogyEn : c.analogy}</p>
                <p style={a}><b>{en ? "In the model: " : "模型位置："}</b>{en ? c.positionEn : c.position}</p>
                <p style={{...a, color: "#4ade80"}}><b>{en ? "Try it: " : "试试："}</b>{en ? c.experimentEn : c.experiment}</p>
                <p style={{...a, color: "#f59e0b"}}><b>{en ? "Common misreading: " : "易误读："}</b>{en ? c.misreadEn : c.misread}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
