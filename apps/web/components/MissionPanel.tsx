"use client";
/** V0.4 任务面板——列表 + 预测→揭示→反思→完成闭环 + 徽章进度 */
import { useEffect, useState } from "react";
import { MISSIONS, checkMission } from "../lib/missions";
import type { Mission } from "../lib/missions";
import PredictionCard from "./PredictionCard";
import type { Phase } from "./PredictionCard";
import type { SimResultWithUnc } from "../lib/sim";
import { useI18n } from "../lib/i18n";
import { missionView } from "../lib/missions";

const STORE_KEY = "fe-missions-v1";
interface MissionRecord { missionId: string; completedAt: string; reflection?: string; predictionCorrect: boolean }

export default function MissionPanel(props: { sim: SimResultWithUnc }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [records, setRecords] = useState<MissionRecord[]>([]);
  const { locale } = useI18n();

  useEffect(() => {
    try { setRecords(JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]")); } catch { /* */ }
  }, []);

  const save = (r: MissionRecord) => {
    const next = [...records.filter((x) => x.missionId !== r.missionId), r];
    setRecords(next);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  };

  const active = MISSIONS.find((m) => m.id === activeId) ?? null;
  const completedCount = records.length;
  const nextMission = MISSIONS.find((m) => !records.some((r) => r.missionId === m.id));

  // 列表视图
  if (!active) return (
    <div data-testid="mission-list" style={{ fontSize: 16 }}>
      <div style={{ marginBottom: 12, padding: "8px 12px", background: "#0f172a", borderRadius: 8, border: "1px solid #334155" }}>
        <span style={{ color: "#e0f2fe", fontWeight: "bold" }}>{locale === "en" ? "🎓 Future Lab" : "🎓 未来实验室"}</span>
        <span style={{ color: "#94a3b8", marginLeft: 8 }}>{locale === "en" ? `${completedCount}/${MISSIONS.length} missions done` : `已完成 ${completedCount}/${MISSIONS.length} 个任务`}</span>
        {nextMission && <span style={{ color: "#4ade80", marginLeft: 8 }}>{locale === "en" ? `Next: ${nextMission.icon} ${missionView(nextMission, locale).title}` : `下一个：${nextMission.icon} ${nextMission.title}`}</span>}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {MISSIONS.map((m) => {
          const rec = records.find((r) => r.missionId === m.id);
          const cat = { concept: "#38bdf8", scenario: "#a78bfa", city: "#fbbf24", impact: "#4ade80" }[m.category];
          return (
            <button key={m.id} onClick={() => { setActiveId(m.id); setPhase("intro"); }}
              style={{
                display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", cursor: "pointer",
                border: `1px solid ${rec ? "#4ade80" : "#1e293b"}`, borderRadius: 10,
                background: rec ? "#14532d18" : "#0f172a", textAlign: "left", opacity: rec ? 0.8 : 1,
              }}>
              <span style={{ fontSize: 24 }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: rec ? "#4ade80" : "#e0f2fe", fontSize: 15, fontWeight: "bold" }}>
                  {missionView(m, locale).title} {rec && "✓"}
                </div>
                <div style={{ color: "#94a3b8", fontSize: 15, marginTop: 2 }}>{missionView(m, locale).goal}</div>
              </div>
              <span style={{ color: cat, fontSize: 16, border: `1px solid ${cat}44`, borderRadius: 4, padding: "2px 6px" }}>
                {locale === "en" ? { concept: "Concept", scenario: "Scenario", city: "City", impact: "Impact" }[m.category] : { concept: "概念", scenario: "情景", city: "城市", impact: "影响" }[m.category]}
              </span>
            </button>
          );
        })}
      </div>
      {completedCount > 0 && (
        <div style={{ marginTop: 12, padding: "8px 12px", background: "#1e293b", borderRadius: 8 }}>
          <b style={{ color: "#e0f2fe", fontSize: 16 }}>{locale === "en" ? "🏅 Explorer Badges" : "🏅 探索徽章"}</b>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {completedCount >= 1 && <span style={{ fontSize: 20 }} title={locale === "en" ? "First mission completed" : "首次完成"}>🥉</span>}
            {completedCount >= 2 && <span style={{ fontSize: 20 }} title={locale === "en" ? "Two missions completed" : "双任务"}>🥈</span>}
            {completedCount >= 4 && <span style={{ fontSize: 20 }} title={locale === "en" ? "All missions completed" : "全部完成"}>🥇</span>}
          </div>
        </div>
      )}
    </div>
  );

  // 任务详情视图
  const handleAnswer = (optionId: string) => {
    setPhase("revealed");
  };
  const handleReflect = (text: string) => {
    save({ missionId: active.id, completedAt: new Date().toISOString(), reflection: text, predictionCorrect: true });
    setPhase("done");
  };
  return (
    <div data-testid="mission-active">
      <button onClick={() => setActiveId(null)} style={{ marginBottom: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid #334155", background: "#0f172a", color: "#94a3b8", cursor: "pointer", fontSize: 16 }}>{locale === "en" ? "← Back to List" : "← 返回列表"}</button>
      <PredictionCard mission={active} phase={phase} onAnswer={handleAnswer} onReflect={handleReflect} onComplete={() => { setActiveId(null); setPhase("intro"); }} />
      {phase === "revealed" && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button onClick={() => setPhase("reflecting")} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #38bdf8", background: "#0c4a6e", color: "#e0f2fe", cursor: "pointer", fontSize: 15 }}>
            {locale === "en" ? "→ Start Exploring" : "→ 开始实验探索"}
          </button>
        </div>
      )}
    </div>
  );
}
