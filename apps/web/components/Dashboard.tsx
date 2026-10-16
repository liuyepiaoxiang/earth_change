"use client";
import { useEffect, useMemo, useState } from "react";
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

const centerStyle = { height: "100%", display: "grid", placeItems: "center", color: "#475569" } as const;

export default function Dashboard({ embed = false }: { embed?: boolean }) {
  const initial = typeof window !== "undefined" ? parseUrlState(window.location.href) : {};
  const [scenario, setScenario] = useState<ScenarioId>(initial.scenario ?? "ssp245");
  const [year, setYear] = useState(initial.year ?? 2100);
  const [uncertain, setUncertain] = useState(initial.uncertainty ?? false);
  const [exp, setExp] = useState<ExperimentControls | undefined>(initial.exp);
  const [city, setCity] = useState<CityRow | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { sim, error } = useSimulation(scenario, uncertain, exp);
  const cities = useMemo(() => loadCities(), []);
  const pattern = useMemo(() => loadWarmingPattern(), []);
  useEffect(() => {
    const url = serializeUrlState({ scenario, year, uncertainty: uncertain, exp }, window.location.pathname);
    window.history.replaceState(null, "", url);
  }, [scenario, year, uncertain, exp]);

  const snap = sim ? metricsAt(sim, year) : null;
  const unc = sim ? metricsUncAt(sim, year) : null;

  return (
    <main style={{ height: "100vh", display: "grid", gridTemplateRows: "auto 1fr auto" }}>
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

      <section style={{ position: "relative", minHeight: 0 }}>
        {sim && snap ? (
          <GlobeView snap={snap} cities={cities} pattern={pattern} onSelectCity={setCity} />
        ) : (
          <div style={centerStyle}>{error ? `引擎加载失败：${error}` : "引擎装载中…"}</div>
        )}
        {city && snap && <CityPanel city={city} snap={snap} pattern={pattern} onClose={() => setCity(null)} />}
        {showAnalysis && sim && (
          <AnalysisDrawer sim={sim} year={year} onClose={() => setShowAnalysis(false)}
            exp={exp} onExpChange={setExp} onExitExp={() => setExp(undefined)} />
        )}
      </section>

      <footer style={{ padding: "10px 16px", borderTop: "1px solid #1e293b", display: "flex" }}>
        <Timeline year={year} onChange={setYear} disabled={!sim} />
      </footer>
    </main>
  );
}
