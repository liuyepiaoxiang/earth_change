"use client";
/** AI 气候问答——规则引擎版 UI */
import { useMemo, useState } from "react";
import { answerClimateQuestion, PRESET_QUESTIONS } from "../lib/climate-qa";
import type { QAResult } from "../lib/climate-qa";
import Link from "next/link";

const card: React.CSSProperties = { background: "#0f172a", borderRadius: 12, border: "1px solid #334155", padding: 16 };
const input: React.CSSProperties = { width: "100%", background: "#0f172a", color: "#e2e8f0", border: "2px solid #38bdf8", borderRadius: 12, padding: "14px 18px", fontSize: 15, outline: "none", boxSizing: "border-box" };
const btn: React.CSSProperties = { padding: "10px 20px", borderRadius: 10, border: "none", background: "#0c4a6e", color: "#e0f2fe", fontSize: 14, fontWeight: "bold", cursor: "pointer" };
const chip: React.CSSProperties = { padding: "6px 14px", background: "#0f172a", color: "#94a3b8", borderRadius: 20, border: "1px solid #334155", cursor: "pointer", fontSize: 12 };

export default function ClimateQA() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QAResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const ask = (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setQuestion(q);
    // 模拟异步（未来可接 LLM API）
    setTimeout(() => {
      const r = answerClimateQuestion(q);
      setResult(r);
      setLoading(false);
      setHistory(prev => [q, ...prev.filter(h => h !== q)].slice(0, 5));
    }, 300);
  };

  const grouped = useMemo(() => {
    const groups: Record<string, typeof PRESET_QUESTIONS> = {};
    for (const q of PRESET_QUESTIONS) {
      (groups[q.category] ??= []).push(q);
    }
    return groups;
  }, []);

  return (
    <div data-testid="climate-qa" style={{ fontSize: 14 }}>
      {/* 搜索框 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(question)}
          placeholder="输入气候问题，如：上海 2100 年会被淹没吗？"
          style={input}
          aria-label="气候问题输入"
        />
        <button onClick={() => ask(question)} disabled={loading || !question.trim()} style={{ ...btn, opacity: loading || !question.trim() ? 0.5 : 1 }}>
          {loading ? "⏳ 计算中…" : "🔍 问"}
        </button>
      </div>

      {/* 预设问题 */}
      {!result && !loading && (
        <div>
          <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>试试这些问题：</p>
          {Object.entries(grouped).map(([cat, qs]) => (
            <div key={cat} style={{ marginBottom: 12 }}>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>📋 {cat}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {qs.slice(0, 5).map(({ question: q }) => (
                  <button key={q} onClick={() => ask(q)} style={chip}>{q}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 回答 */}
      {loading && (
        <div style={{ ...card, textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🌍</div>
          <div style={{ color: "#94a3b8" }}>正在运行气候模型…</div>
        </div>
      )}

      {result && !loading && (
        <div>
          <div style={card}>
            <div style={{ color: "#38bdf8", fontSize: 12, marginBottom: 8 }}>❓ {result.question}</div>
            <div style={{ color: "#e2e8f0", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{result.answer}</div>
          </div>

          {/* 数据时间线 */}
          <div style={{ ...card, marginTop: 12 }}>
            <div style={{ color: "#7dd3fc", fontSize: 13, marginBottom: 10 }}>📊 数据（{result.data[0]?.label ?? ""}）</div>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80 }}>
              {result.data.map((d, i) => {
                const max = Math.max(...result.data.map(x => Math.abs(x.value)));
                const h = (Math.abs(d.value) / max) * 70;
                return (
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ color: "#fbbf24", fontSize: 10, marginBottom: 2 }}>{d.value.toFixed(1)}</div>
                    <div style={{ height: h, background: "linear-gradient(180deg,#38bdf8,#0c4a6e)", borderRadius: 4, minHeight: 4 }} />
                    <div style={{ color: "#64748b", fontSize: 9, marginTop: 2 }}>{d.year}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ color: "#475569", fontSize: 10, textAlign: "right", marginTop: 4 }}>单位：{result.data[0]?.unit}</div>
          </div>

          {/* 来源 */}
          <div style={{ marginTop: 10, fontSize: 11, color: "#64748b" }}>
            📎 数据来源：{result.sources.join(" · ")}
          </div>

          {/* 追问 */}
          <div style={{ marginTop: 16 }}>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>🤔 继续追问：</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {result.followUps.map(fq => (
                <button key={fq} onClick={() => ask(fq)} style={{ ...chip, borderColor: "#38bdf844" }}>{fq}</button>
              ))}
            </div>
          </div>

          {/* 打开可视化 */}
          <Link
            href={`/?scenario=${result.scenario}&year=${result.data[Math.floor(result.data.length / 2)]?.year ?? 2100}`}
            style={{ display: "block", marginTop: 16, padding: "10px 20px", textAlign: "center", background: "#0c4a6e", color: "#e0f2fe", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: "bold", border: "1px solid #38bdf8" }}
          >
            🌍 在 3D 地球上查看 →
          </Link>
        </div>
      )}

      {/* 搜索历史 */}
      {history.length > 0 && !loading && (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>🕘 最近提问</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {history.map(h => (
              <button key={h} onClick={() => ask(h)} style={{ ...chip, fontSize: 10, padding: "4px 10px" }}>{h}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
