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
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "../lib/i18n";
import { milestoneEvents } from "@future-earth/engine";
import type { MilestoneEvent } from "@future-earth/engine";

const centerStyle = { height: "100%", display: "grid", placeItems: "center", color: "#475569" } as const;

export default function Dashboard({ embed = false }: { embed?: boolean }) {
  const { t } = useI18n();
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
        background: "transparent",
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
          borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
          flexWrap: "wrap",
        }}
      >
        <strong style={{ color: "#f1f5f9", letterSpacing: 0.3, fontSize: 15 }}>🌍 {t("app.title")}</strong>
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
            {t("app.nav.earth")}
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
            {t("app.nav.overview")}
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
            💬 {t("app.nav.ask")}
          </a>
        </nav>}
        <ScenarioSelector value={scenario} onChange={setScenario} />
        {!embed && <button
          onClick={() => setUncertain((v) => !v)}
          aria-pressed={uncertain}
          title={t("app.btn.rangeTitle")}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            border: `1px solid ${uncertain ? "#a78bfa" : "rgba(148, 163, 184, 0.25)"}`,
            background: uncertain ? "#4c1d95" : "rgba(148, 163, 184, 0.06)",
            color: uncertain ? "#ede9fe" : "#94a3b8",
          }}
        >
          ±{t("app.btn.range")}
        </button>}
        {!embed && <button
          onClick={() => setShowAnalysis((v) => !v)}
          aria-pressed={showAnalysis}
          title={t("app.btn.analysisTitle")}
          style={{
            padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13,
            border: `1px solid ${showAnalysis ? "#4ade80" : "rgba(148, 163, 184, 0.25)"}`,
            background: showAnalysis ? "#14532d" : "rgba(148, 163, 184, 0.06)",
            color: showAnalysis ? "#dcfce7" : "#94a3b8",
          }}
        >
          📊 {t("app.btn.analysisPlain")}
        </button>}
        {!embed && <button
          onClick={() => setExp((v) => (v ? undefined : { ...DEFAULT_CONTROLS }))}
          aria-pressed={!!exp}
          title={t("app.btn.experimentTitle")}
          style={{
            padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13,
            border: `1px solid ${exp ? "#fbbf24" : "rgba(148, 163, 184, 0.25)"}`,
            background: exp ? "#78350f" : "rgba(148, 163, 184, 0.06)",
            color: exp ? "#fef3c7" : "#94a3b8",
          }}
        >
          🧪 {t("app.btn.experimentPlain")}
        </button>}
        <MetricsBar snap={snap} unc={unc} />
        {!embed && <LanguageSwitcher />}
      </header>

      {!embed && <LiveEarth />}

      <section style={{ position: "relative", minHeight: 0 }}>
        {sim && snap ? (
          <GlobeView snap={snap} cities={cities} pattern={pattern} onSelectCity={setCity} />
        ) : (
          <div style={centerStyle}>{error ? `${t("common.loadFail")}：${error}` : t("common.loading")}</div>
        )}
        {city && snap && <CityPanel city={city} snap={snap} pattern={pattern} onClose={() => setCity(null)} />}
        <EventNotification event={activeEvent} onDismiss={() => setActiveEvent(null)} />
        {showAnalysis && sim && (
          <AnalysisDrawer sim={sim} year={year} onClose={() => setShowAnalysis(false)}
            exp={exp} onExpChange={setExp} onExitExp={() => setExp(undefined)} onJumpYear={setYear} snap={snap} pattern={pattern} onSelectCity={setCity} />
        )}
      </section>

      <footer style={{ padding: "10px 16px", borderTop: "1px solid rgba(148, 163, 184, 0.14)", display: "flex" }}>
        <Timeline year={year} onChange={setYear} disabled={!sim} />
      </footer>
    </main>
  );
}
