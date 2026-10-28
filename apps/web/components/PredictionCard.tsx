"use client";
/** V0.4 预测卡——先猜再看（EDU-02） */
import { useState } from "react";
import type { Mission } from "../lib/missions";
import { useI18n } from "../lib/i18n";
import { missionView } from "../lib/missions";

export type Phase = "intro" | "predicting" | "revealed" | "reflecting" | "done";

export default function PredictionCard(props: {
  mission: Mission;
  phase: Phase;
  onAnswer: (optionId: string) => void;
  onReflect: (text: string) => void;
  onComplete: () => void;
}) {
  const { locale } = useI18n();
  const en = locale === "en";
  const [selected, setSelected] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const { mission, phase } = props;
  const m = missionView(mission, locale);
  const isCorrect = selected === m.prediction.correct;
  const opts = m.prediction.options;

  if (phase === "intro") return (
    <div data-testid="prediction-intro" style={{ padding: 16, background: "#0f172a", borderRadius: 12, border: "1px solid #334155" }}>
      <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>{mission.icon}</div>
      <h3 style={{ color: "#e0f2fe", textAlign: "center", margin: "0 0 8px" }}>{m.title}</h3>
      <p style={{ color: "#94a3b8", fontSize: 15, textAlign: "center" }}>{mission.intro}</p>
      <p style={{ color: "#4ade80", fontSize: 16, textAlign: "center", marginTop: 8 }}>🎯 {mission.goal}</p>
    </div>
  );

  if (phase === "predicting") return (
    <div data-testid="prediction-question" style={{ padding: 16 }}>
      <p style={{ color: "#e0f2fe", fontSize: 16, marginBottom: 12 }}>{m.prediction.question}</p>
      <div style={{ display: "grid", gap: 8 }}>
        {opts.map((o) => (
          <button key={o.id} onClick={() => { setSelected(o.id); props.onAnswer(o.id); }}
            style={{
              padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 16,
              border: `1px solid ${selected === o.id ? "#38bdf8" : "#334155"}`,
              background: selected === o.id ? "#0c4a6e" : "#0f172a",
              color: selected === o.id ? "#e0f2fe" : "#94a3b8", textAlign: "left",
            }}>
            {o.id.toUpperCase()}. {o.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (phase === "revealed") return (
    <div data-testid="prediction-revealed" style={{ padding: 16 }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 36 }}>{isCorrect ? "🎯" : "📊"}</span>
        <div style={{ color: isCorrect ? "#4ade80" : "#fbbf24", fontSize: 16, fontWeight: "bold", marginTop: 4 }}>
          {isCorrect ? (en ? "Spot on!" : "判断准确！") : (en ? "Worth exploring further" : "值得更深入探索")}
        </div>
      </div>
      <div style={{ background: "#1e293b", borderRadius: 8, padding: 12, marginBottom: 10 }}>
        <div style={{ color: "#94a3b8", fontSize: 15 }}>{en ? "Your choice" : "你的选择"}</div>
        <div style={{ color: "#e0f2fe" }}>{opts.find((o) => o.id === selected)?.label ?? "—"}</div>
      </div>
      <div style={{ background: "#1e293b", borderRadius: 8, padding: 12, marginBottom: 10 }}>
        <div style={{ color: "#94a3b8", fontSize: 15 }}>{en ? "Explanation" : "解释"}</div>
        <div style={{ color: "#e2e8f0", fontSize: 15 }}>{m.prediction.explanation}</div>
      </div>
      <details style={{ marginBottom: 10 }}>
        <summary style={{ color: "#38bdf8", cursor: "pointer", fontSize: 16 }}>💡 {en ? "Why does this happen?" : "为什么会这样？"}</summary>
        <div style={{ color: "#cbd5e1", fontSize: 16, marginTop: 6, paddingLeft: 12 }}>
          <p>🔹 {m.reason.oneLiner}</p>
          <p style={{ fontFamily: "monospace", background: "#0f172a", padding: 8, borderRadius: 6 }}>{m.reason.causal}</p>
          <details>
            <summary style={{ color: "#475569", fontSize: 15 }}>{en ? "Technical details" : "技术细节"}</summary>
            <p style={{ fontSize: 15 }}>{m.reason.technical}</p>
          </details>
        </div>
      </details>
      <div style={{ color: "#f59e0b", fontSize: 15, marginTop: 8 }}>⚠ {m.limits.join(en ? "; " : "；")}</div>
      <p style={{ color: "#94a3b8", fontSize: 15, marginTop: 12 }}>💡 {en ? "Hint: " : "提示："}{m.hint}</p>
    </div>
  );

  if (phase === "reflecting") return (
    <div data-testid="prediction-reflect" style={{ padding: 16 }}>
      <p style={{ color: "#e0f2fe", fontSize: 16, marginBottom: 8 }}>{en ? "Summarize your finding in one sentence:" : "用一句话复述你的发现："}</p>
      <p style={{ color: "#94a3b8", fontSize: 16, fontStyle: "italic", marginBottom: 12 }}>
        {en
          ? '"I observed ______, because ______, but this result cannot tell ______."'
          : '"我观察到 ______，因为 ______，但这个结果不能说明 ______。"'}
      </p>
      <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} rows={3}
        placeholder={en ? "Write your observation and reasoning..." : "填入你的观察和理解..."}
        style={{ width: "100%", background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 8, padding: 10, fontSize: 15, resize: "vertical" }} />
      <button onClick={() => reflection.trim().length > 10 && props.onReflect(reflection)}
        disabled={reflection.trim().length <= 10}
        style={{ marginTop: 8, padding: "8px 16px", borderRadius: 8, cursor: reflection.trim().length > 10 ? "pointer" : "not-allowed", border: "1px solid #4ade80", background: reflection.trim().length > 10 ? "#14532d" : "#1e293b", color: reflection.trim().length > 10 ? "#dcfce7" : "#64748b", fontSize: 15 }}>
        ✓ {en ? "Finish summary" : "完成复述"}
      </button>
    </div>
  );

  return (
    <div data-testid="prediction-done" style={{ padding: 16, textAlign: "center" }}>
      <span style={{ fontSize: 36 }}>🏆</span>
      <p style={{ color: "#4ade80", fontSize: 16, fontWeight: "bold" }}>{en ? "Mission complete!" : "任务完成！"}</p>
      {mission.nextMissionId && <p style={{ color: "#94a3b8", fontSize: 16 }}>{en ? "Recommended next mission →" : "推荐下一个任务 →"}</p>}
      <button onClick={props.onComplete} style={{ marginTop: 8, padding: "6px 14px", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", cursor: "pointer", fontSize: 16 }}>
        {en ? "Back to mission list" : "返回任务列表"}
      </button>
    </div>
  );
}
