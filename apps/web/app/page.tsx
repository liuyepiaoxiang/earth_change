"use client";
import { useMemo, useState } from "react";
import { loadCities, loadWarmingPattern } from "@future-earth/data";
import type { CityRow } from "@future-earth/data";
import type { ScenarioId } from "@future-earth/engine";
import { metricsAt, useSimulation } from "../lib/sim";
import ScenarioSelector from "../components/ScenarioSelector";
import MetricsBar from "../components/MetricsBar";
import Timeline from "../components/Timeline";
import GlobeView from "../components/GlobeView";
import CityPanel from "../components/CityPanel";

const centerStyle = { height: "100%", display: "grid", placeItems: "center", color: "#475569" } as const;

export default function Home() {
  const [scenario, setScenario] = useState<ScenarioId>("ssp245");
  const [year, setYear] = useState(2100);
  const [city, setCity] = useState<CityRow | null>(null);
  const { sim, error } = useSimulation(scenario);
  const cities = useMemo(() => loadCities(), []);
  const pattern = useMemo(() => loadWarmingPattern(), []);
  const snap = sim ? metricsAt(sim, year) : null;

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
        <ScenarioSelector value={scenario} onChange={setScenario} />
        <MetricsBar snap={snap} />
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
