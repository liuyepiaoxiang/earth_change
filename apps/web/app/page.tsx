"use client";
import { useMemo, useState } from "react";
import { loadCities, loadWarmingPattern } from "@future-earth/data";
import type { CityRow } from "@future-earth/data";
import type { ScenarioId } from "@future-earth/engine";
import { metricsAt, metricsUncAt, useSimulation } from "../lib/sim";
import ScenarioSelector from "../components/ScenarioSelector";
import MetricsBar from "../components/MetricsBar";
import Timeline from "../components/Timeline";
import GlobeView from "../components/GlobeView";
import CityPanel from "../components/CityPanel";

const centerStyle = { height: "100%", display: "grid", placeItems: "center", color: "#475569" } as const;

export default function Home() {
  const [scenario, setScenario] = useState<ScenarioId>("ssp245");
  const [year, setYear] = useState(2100);
  const [uncertain, setUncertain] = useState(false);
  const [city, setCity] = useState<CityRow | null>(null);
  const { sim, error } = useSimulation(scenario, uncertain);
  const cities = useMemo(() => loadCities(), []);
  const pattern = useMemo(() => loadWarmingPattern(), []);
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
        <nav style={{ display: "flex", gap: 6 }}>
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
        </nav>
        <ScenarioSelector value={scenario} onChange={setScenario} />
        <button
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
        </button>
        <MetricsBar snap={snap} unc={unc} />
      </header>

      <section style={{ position: "relative", minHeight: 0 }}>
        {sim && snap ? (
          <GlobeView snap={snap} cities={cities} pattern={pattern} onSelectCity={setCity} />
        ) : (
          <div style={centerStyle}>{error ? `引擎加载失败：${error}` : "引擎装载中…"}</div>
        )}
        {city && snap && <CityPanel city={city} snap={snap} pattern={pattern} onClose={() => setCity(null)} />}
      </section>

      <footer style={{ padding: "10px 16px", borderTop: "1px solid #1e293b", display: "flex" }}>
        <Timeline year={year} onChange={setYear} disabled={!sim} />
      </footer>
    </main>
  );
}
