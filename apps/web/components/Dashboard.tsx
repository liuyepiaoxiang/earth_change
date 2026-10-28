"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadCities, loadWarmingPattern } from "@future-earth/data";
import type { CityRow } from "@future-earth/data";
import { DEFAULT_CONTROLS } from "@future-earth/engine";
import type { ScenarioId, ExperimentControls } from "@future-earth/engine";
import { parseUrlState, serializeUrlState } from "../lib/url-state";
import { metricsAt, metricsUncAt, useSimulation } from "../lib/sim";
import ScenarioSelector from "./ScenarioSelector";
import MetricsBar from "./MetricsBar";
import Timeline from "./Timeline";
import GlobeView from "./GlobeView";
import CityPanel from "./CityPanel";
import AnalysisDrawer from "./AnalysisDrawer";
import EventNotification from "./EventNotification";
import LiveEarth from "./LiveEarth";
import { milestoneEvents } from "@future-earth/engine";
import type { MilestoneEvent } from "@future-earth/engine";

const centerStyle = { height: "100%", display: "grid", placeItems: "center", color: "#475569" } as const;

export default function Dashboard({ embed = false }: { embed?: boolean }) {
  // SSR 安全：默认值渲染，挂载后从 URL 恢复可复现状态（v0.3 分享链接入口）
  const [scenario, setScenario] = useState<ScenarioId>("ssp245");
  const [year, setYear] = useState(2100);
  const [uncertain, setUncertain] = useState(false);
  const [exp, setExp] = useState<ExperimentControls | undefined>(undefined);
  const [city, setCity] = useState<CityRow | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { sim, error } = useSimulation(scenario, uncertain, exp);
  const cities = useMemo(() => loadCities(), []);
  const pattern = useMemo(() => loadWarmingPattern(), []);
  const firstRender = useRef(true);
  useEffect(() => {
    const st = parseUrlState(window.location.href);
    if (st.scenario) setScenario(st.scenario);
    if (st.year !== undefined) setYear(st.year);
    if (st.uncertainty !== undefined) setUncertain(st.uncertainty);
    setExp(st.exp);
  }, []);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; } // 跳过挂载首拍，先让 URL 恢复生效
    const url = serializeUrlState({ scenario, year, uncertainty: uncertain, exp }, window.location.pathname);
    window.history.replaceState(null, "", url);
  }, [scenario, year, uncertain, exp]);

  const snap = sim ? metricsAt(sim, year) : null;
  const unc = sim ? metricsUncAt(sim, year) : null;

  // V4.1 里程碑事件通知——用 Set 防重复（向后拖再向前不会重复弹）
  const [activeEvent, setActiveEvent] = useState<MilestoneEvent | null>(null);
  const shownEventsRef = useRef<Set<number>>(new Set());
  const allEvents = useMemo(() => (sim ? milestoneEvents(sim) : []), [sim]);
  useEffect(() => {
    const next = allEvents.find((e) => !shownEventsRef.current.has(e.year) && e.year <= year && e.year > 2025);
    if (next) {
      shownEventsRef.current.add(next.year);
      setActiveEvent(next);
    }
  }, [year, allEvents]);

  return (
    <main
      style={{
        height: "100vh",
        display: "grid",
        // 非 embed 模式多一行 LiveEarth 卡片，防止地球 section 被挤进隐式 auto 行（高度塌 0）
        gridTemplateRows: embed ? "auto 1fr auto" : "auto auto 1fr auto",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "8px 16px",
          borderBottom: "1px solid #1e293b",
          flexWrap: "wrap",
        }}
      >
        <strong style={{ color: "#e0f2fe" }}>🌍 未来地球引擎</strong>
        {!embed && <nav style={{ display: "flex", gap: 6 }}>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 13,
              border: "1px solid #38bdf8",
              background: "#0c4a6e",
              color: "#e0f2fe",
            }}
          >
            地球
          </span>
          <a
            href="/overview"
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 13,
              border: "1px solid #334155",
              color: "#94a3b8",
              textDecoration: "none",
            }}
          >
            要素总览
          </a>
          <a
            href="/ask"
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 13,
              border: "1px solid #7c3aed",
              color: "#c4b5fd",
              textDecoration: "none",
            }}
          >
            🤖 AI 问答
          </a>
        </nav>}
        <ScenarioSelector value={scenario} onChange={setScenario} />
        {!embed && <button
          onClick={() => setUncertain((v) => !v)}
          aria-pressed={uncertain}
          title="种子化确定性蒙特卡洛：参数先验采样 → p10/p90 区间（约 1 秒）"
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            border: `1px solid ${uncertain ? "#a78bfa" : "#334155"}`,
            background: uncertain ? "#4c1d95" : "transparent",
            color: uncertain ? "#ede9fe" : "#94a3b8",
          }}
        >
          ±区间
        </button>}
        {!embed && <button
          onClick={() => setShowAnalysis((v) => !v)}
          aria-pressed={showAnalysis}
          title="v0.2 分析面板：时间序列 / 观测对照 / 海平面分量 / 贡献分解 / 结果说明"
          style={{
            padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13,
            border: `1px solid ${showAnalysis ? "#4ade80" : "#334155"}`,
            background: showAnalysis ? "#14532d" : "transparent",
            color: showAnalysis ? "#dcfce7" : "#94a3b8",
          }}
        >
          📊 分析
        </button>}
        {!embed && <button
          onClick={() => setExp((v) => (v ? undefined : { ...DEFAULT_CONTROLS }))}
          aria-pressed={!!exp}
          title="v0.3 情景实验室：自定义排放路径/甲烷/碳汇/海岸防护（教育性实验，排放驱动）"
          style={{
            padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13,
            border: `1px solid ${exp ? "#fbbf24" : "#334155"}`,
            background: exp ? "#78350f" : "transparent",
            color: exp ? "#fef3c7" : "#94a3b8",
          }}
        >
          🧪 实验
        </button>}
        <MetricsBar snap={snap} unc={unc} />
      </header>

      {!embed && <LiveEarth />}

      <section style={{ position: "relative", minHeight: 0 }}>
        {sim && snap ? (
          <GlobeView snap={snap} cities={cities} pattern={pattern} onSelectCity={setCity} />
        ) : (
          <div style={centerStyle}>{error ? `引擎加载失败：${error}` : "引擎装载中…"}</div>
        )}
        {city && snap && <CityPanel city={city} snap={snap} pattern={pattern} onClose={() => setCity(null)} />}
        <EventNotification event={activeEvent} onDismiss={() => setActiveEvent(null)} />
        {showAnalysis && sim && (
          <AnalysisDrawer sim={sim} year={year} onClose={() => setShowAnalysis(false)}
            exp={exp} onExpChange={setExp} onExitExp={() => setExp(undefined)} onJumpYear={setYear} snap={snap} pattern={pattern} onSelectCity={setCity} />
        )}
      </section>

      <footer style={{ padding: "10px 16px", borderTop: "1px solid #1e293b", display: "flex" }}>
        <Timeline year={year} onChange={setYear} disabled={!sim} />
      </footer>
    </main>
  );
}
