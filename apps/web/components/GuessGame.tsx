"use client";
/** 🎮 猜猜看小游戏——拖到温度到目标线，看你能多准（15 秒一局） */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SimResultWithUnc } from "../lib/sim";

interface Round { targetYear: number; targetDT: number; scenario: string; label: string }
const SCENARIOS = ["ssp126", "ssp245", "ssp370", "ssp585"] as const;
const SCEN_NAME: Record<string, string> = { ssp126: "SSP1-2.6（低排放）", ssp245: "SSP2-4.5（中间路线）", ssp370: "SSP3-7.0（中高排放）", ssp585: "SSP5-8.5（高排放）" };

function makeRound(sim: SimResultWithUnc): Round {
  const years = [2030, 2040, 2050, 2060, 2075, 2090, 2100, 2120, 2150];
  const y = years[Math.floor(Math.random() * years.length)]!;
  const i = sim.years.indexOf(y);
  const dT = sim.metrics.tempAnomaly[i]!;
  // 找一个有数据的情景
  const sc = SCENARIOS[Math.floor(Math.random() * 4)] ?? "ssp245";
  return { targetYear: y, targetDT: dT, scenario: sc, label: `${SCEN_NAME[sc] ?? sc} ${y} 年` };
}

type GameState = "idle" | "playing" | "result";
const DIFFS = ["完美！", "非常接近！", "还不错", "有点偏", "差很远..."];
const MEDALS = ["🏆", "🥇", "🥈", "🥉", "😅"];

export default function GuessGame(props: { sim: SimResultWithUnc; currentYear: number; onJumpYear: (y: number) => void }) {
  const [state, setState] = useState<GameState>("idle");
  const [round, setRound] = useState<Round | null>(null);
  const [guess, setGuess] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const start = useCallback(() => {
    const r = makeRound(props.sim);
    setRound(r);
    setGuess(props.currentYear);
    setState("playing");
  }, [props.sim, props.currentYear]);

  const submit = useCallback(() => {
    if (!round) return;
    const i = props.sim.years.indexOf(guess);
    if (i < 0) return;
    const myDT = props.sim.metrics.tempAnomaly[i]!;
    const diff = Math.abs(myDT - round.targetDT);
    const idx = diff < 0.1 ? 0 : diff < 0.3 ? 1 : diff < 0.6 ? 2 : diff < 1.5 ? 3 : 4;
    const points = [100, 70, 40, 15, 0][idx]!;
    setScore((s) => s + points);
    setStreak((s) => { const ns = idx <= 1 ? s + 1 : 0; setBestStreak((b) => Math.max(b, ns)); return ns; });
    setState("result");
    // 跳转到目标年份让用户看真实曲线
    props.onJumpYear(round.targetYear);
  }, [round, guess, props]);

  const next = () => { start(); };

  const timeSlider = useMemo(() => ({
    min: 2026, max: 2150, step: 1, value: guess,
    onChange: (v: number) => setGuess(v),
  }), [guess]);

  if (state === "idle") return (
    <div data-testid="guess-game" style={{ textAlign: "center", padding: 20 }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🎯</div>
      <h3 style={{ color: "#e0f2fe", fontSize: 16, margin: "0 0 6px" }}>猜猜看</h3>
      <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 16px" }}>
        给你一个目标温度，拖到你觉得对的年份——<br/>看你对地球的直觉有多准！
      </p>
      <button onClick={start} style={{ padding: "10px 24px", fontSize: 15, borderRadius: 10, border: "2px solid #4ade80", background: "#14532d", color: "#dcfce7", cursor: "pointer", fontWeight: "bold" }}>
        ▶ 开始游戏
      </button>
      {score > 0 && <div style={{ marginTop: 12, color: "#fbbf24", fontSize: 14 }}>总分 {score} · 最高连对 {bestStreak}</div>}
    </div>
  );

  if (state === "playing" && round) return (
    <div data-testid="guess-playing" style={{ padding: 16 }}>
      <div style={{ background: "#1e293b", borderRadius: 10, padding: 14, marginBottom: 16, border: "1px solid #334155" }}>
        <div style={{ color: "#94a3b8", fontSize: 12 }}>目标：{round.label} 的升温</div>
        <div style={{ color: "#fbbf24", fontSize: 28, fontWeight: "bold", marginTop: 4 }}>
          +{round.targetDT.toFixed(1)}°C
        </div>
      </div>
      <div style={{ marginBottom: 8, color: "#e0f2fe", fontSize: 14 }}>
        你觉得是哪一年？<span style={{ color: "#38bdf8", fontSize: 18, fontWeight: "bold" }}>{guess}</span>
      </div>
      <input type="range" min={2026} max={2150} step={1} value={guess} onChange={(e) => setGuess(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#38bdf8", height: 28 }} />
      <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: 12, marginTop: 4 }}>
        <span>2026</span><span>2150</span>
      </div>
      <button onClick={submit} style={{ width: "100%", marginTop: 16, padding: "10px 0", fontSize: 15, borderRadius: 10, border: "2px solid #38bdf8", background: "#0c4a6e", color: "#e0f2fe", cursor: "pointer", fontWeight: "bold" }}>
        🔍 揭晓答案
      </button>
    </div>
  );

  if (state === "result" && round) {
    const i = props.sim.years.indexOf(guess);
    const myDT = i >= 0 ? props.sim.metrics.tempAnomaly[i]! : 0;
    const actualYear = props.sim.years[props.sim.metrics.tempAnomaly.findIndex((t) => Math.abs(t - round.targetDT) < 0.05)] ?? round.targetYear;
    const diff = Math.abs(myDT - round.targetDT);
    const idx = diff < 0.1 ? 0 : diff < 0.3 ? 1 : diff < 0.6 ? 2 : diff < 1.5 ? 3 : 4;
    return (
      <div data-testid="guess-result" style={{ padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 4 }}>{MEDALS[idx]}</div>
        <div style={{ color: idx <= 1 ? "#4ade80" : idx <= 2 ? "#fbbf24" : "#f87171", fontSize: 16, fontWeight: "bold" }}>{DIFFS[idx]}</div>
        <div style={{ marginTop: 12, background: "#0f172a", borderRadius: 10, padding: 12, border: "1px solid #334155" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><div style={{ color: "#94a3b8", fontSize: 12 }}>你的答案</div><div style={{ color: "#38bdf8", fontSize: 18, fontWeight: "bold" }}>{guess} 年</div></div>
            <div><div style={{ color: "#94a3b8", fontSize: 12 }}>该年实际升温</div><div style={{ color: "#e0f2fe", fontSize: 18, fontWeight: "bold" }}>+{myDT.toFixed(1)}°C</div></div>
            <div><div style={{ color: "#94a3b8", fontSize: 12 }}>目标升温</div><div style={{ color: "#fbbf24", fontSize: 18, fontWeight: "bold" }}>+{round.targetDT.toFixed(1)}°C</div></div>
            <div><div style={{ color: "#94a3b8", fontSize: 12 }}>偏差</div><div style={{ color: diff < 0.3 ? "#4ade80" : "#f87171", fontSize: 18, fontWeight: "bold" }}>{diff.toFixed(1)}°C</div></div>
          </div>
        </div>
        <div style={{ color: "#fbbf24", fontSize: 14, marginTop: 10 }}>得分 +{[100, 70, 40, 15, 0][idx]} · 连对 {streak}</div>
        <button onClick={next} style={{ marginTop: 14, padding: "10px 24px", fontSize: 15, borderRadius: 10, border: "2px solid #4ade80", background: "#14532d", color: "#dcfce7", cursor: "pointer", fontWeight: "bold" }}>
          🔄 再来一局
        </button>
      </div>
    );
  }
  return null;
}
