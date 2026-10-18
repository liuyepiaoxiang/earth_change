"use client";
/** V0.4 导览模式——三个预设问题入口 + 概念卡（docs/12 §5.1 + §6.4） */
import { useState } from "react";

const card: React.CSSProperties = { border: "1px solid #334155", borderRadius: 12, padding: 16, background: "#0f172a", cursor: "pointer", transition: "border-color 0.2s" };
const conceptCard: React.CSSProperties = { ...card, cursor: "default" };
const q: React.CSSProperties = { fontSize: 13, color: "#e0f2fe", fontWeight: "bold", marginBottom: 6 };
const a: React.CSSProperties = { fontSize: 12, color: "#94a3b8", lineHeight: 1.5 };

interface Concept { icon: string; term: string; define: string; analogy: string; position: string; experiment: string; misread: string }
const CONCEPTS: Concept[] = [
  {
    icon: "🏭", term: "排放路径", define: "人类每年向大气排放多少 CO₂ 的未来方案。",
    analogy: "像水龙头的开度——决定水位（浓度）上升的速度。",
    position: "情景输入（SSP / 实验室可调）",
    experiment: "在实验室调低排放强度到 0.6 倍，看 CO₂ 曲线变化。",
    misread: "排放减少 ≠ 浓度立即下降（累积效应）。",
  },
  {
    icon: "🌡️", term: "辐射强迫", define: "温室气体改变地球能量收支的强度（W/m²）。",
    analogy: "像给地球盖了一层越来越厚的毯子。",
    position: "方程 eq_07–09（CO₂/CH₄/N₂O + 其他）",
    experiment: "打开「为什么会这样」看当前年的强迫分解。",
    misread: "强迫大 ≠ 温度立刻高（海洋吸热延缓）。",
  },
  {
    icon: "🌊", term: "两层海洋模型", define: "海洋分表层（快响应）和深层（慢响应）两层。",
    analogy: "像一杯热茶——表面凉得快，杯底还是热的。",
    position: "方程 eq_11/12（RK4 求解）",
    experiment: "对比观测对照——看海洋如何延缓 20 世纪的升温。",
    misread: "海洋延缓 ≠ 消除升温——深海最终也会变暖。",
  },
  {
    icon: "🧊", term: "海平面四分量", define: "热膨胀 + 冰川 + 冰盖 + 陆地水 = 总海平面上升。",
    analogy: "四个水龙头同时往浴缸里放水，速度各不同。",
    position: "方程 eq_14/26/27/31",
    experiment: "打开「海平面分量」看四色堆叠图。",
    misread: "海平面不会因减排立即停止上升（冰冻圈滞后）。",
  },
  {
    icon: "📊", term: "参数不确定性", define: "模型参数不精确导致的预测区间（p10–p90）。",
    analogy: "像天气预报说「降水概率 60%」而不是「一定下雨」。",
    position: "蒙特卡洛先验采样（±区间按钮）",
    experiment: "点击「±区间」开启 MC，看温度曲线的阴影带。",
    misread: "MC 区间 ≠ IPCC 共识区间（口径已在结果说明中标注）。",
  },
  {
    icon: "🔍", term: "模式缩放降尺度", define: "全球平均温度 → 城市温度的纬度/陆海差异换算。",
    analogy: "全球均值是平均分，城市是每个学生的分数。",
    position: "方程 eq_51（Pattern Scaling）",
    experiment: "对比上海（沿海）和新德里（内陆）的本地升温。",
    misread: "城市温度 ≠ 当天天气（这是气候态变化，不是天气预报）。",
  },
];

const TOURS = [
  { icon: "🌍", title: "2100 年四种未来有什么差异？", desc: "比较四个 SSP 的温度、CO₂ 和海平面差异", href: "/?scenario=ssp245&year=2100", mission: "m2-scenario-diff" },
  { icon: "🏙️", title: "我的城市会怎样？", desc: "搜索或点击城市，看本地升温、降水、群系和淹没判定", href: "/?scenario=ssp245&year=2100", mission: null },
  { icon: "⏱️", title: "提前减排能改变多少？", desc: "用实验室调整减排时间，看 2100 年差异", href: "/?scenario=ssp245&year=2100", mission: "m4-experiment" },
];

export default function GuidedTour() {
  const [openConcept, setOpenConcept] = useState<number | null>(null);
  return (
    <div data-testid="guided-tour" style={{ padding: "20px 16px", maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ color: "#e0f2fe", textAlign: "center", marginBottom: 6 }}>你想探索哪个问题？</h2>
      <p style={{ color: "#64748b", textAlign: "center", fontSize: 12, marginBottom: 24 }}>选择一个入口，开始你的未来地球实验</p>

      {/* 三个预设入口 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 32 }}>
        {TOURS.map((t) => (
          <a key={t.title} href={t.href} style={{ ...card, textDecoration: "none", display: "block" }}>
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>{t.icon}</div>
            <div style={{ ...q, textAlign: "center" }}>{t.title}</div>
            <div style={{ ...a, textAlign: "center" }}>{t.desc}</div>
          </a>
        ))}
      </div>

      {/* 概念卡库 */}
      <h3 style={{ color: "#94a3b8", fontSize: 14, marginBottom: 12, borderBottom: "1px solid #1e293b", paddingBottom: 8 }}>
        📚 核心概念（点击展开）
      </h3>
      <div style={{ display: "grid", gap: 8 }}>
        {CONCEPTS.map((c, i) => (
          <div key={c.term} style={conceptCard} onClick={() => setOpenConcept(openConcept === i ? null : i)}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
              <b style={{ color: "#e0f2fe", fontSize: 13, flex: 1 }}>{c.term}</b>
              <span style={{ color: "#475569", fontSize: 11 }}>{openConcept === i ? "▼" : "▶"}</span>
            </div>
            {openConcept === i && (
              <div style={{ marginTop: 10, paddingLeft: 30, display: "grid", gap: 6 }}>
                <p style={{...a, color: "#cbd5e1"}}><b>定义：</b>{c.define}</p>
                <p style={a}><b>类比：</b>{c.analogy}</p>
                <p style={a}><b>模型位置：</b>{c.position}</p>
                <p style={{...a, color: "#4ade80"}}><b>试试：</b>{c.experiment}</p>
                <p style={{...a, color: "#f59e0b"}}><b>易误读：</b>{c.misread}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
