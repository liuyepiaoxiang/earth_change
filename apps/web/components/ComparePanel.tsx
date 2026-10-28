"use client";
/** V0.3 对比视图：当前情景/实验 A vs 基准 SSP B——曲线叠加 + 差值卡 + 阈值年 + 受影响城市 */
import { useEffect, useMemo, useState } from "react";
import type { ScenarioId, SimResult, CrossingYears } from "@future-earth/engine";
import { crossingYears } from "@future-earth/engine";
import { loadCities, type CityRow } from "@future-earth/data";
import Chart from "./Chart";
import type { SimResultWithUnc } from "../lib/sim";
import { useI18n } from "../lib/i18n";

const SSPS: ScenarioId[] = ["ssp126", "ssp245", "ssp370", "ssp585"];
const seg = (on: boolean): React.CSSProperties => ({
  padding: "2px 8px", fontSize: 15, cursor: "pointer", border: `1px solid ${on ? "#38bdf8" : "#334155"}`,
  background: on ? "#0c4a6e" : "transparent", color: on ? "#e0f2fe" : "#94a3b8",
});

export function defenseOf(c: CityRow, mode: "none" | "fixed" | "adaptive"): number {
  if (mode === "none") return 0;
  if (mode === "fixed") return c.population >= 1_000_000 ? 2 : 0;
  return c.population >= 5_000_000 ? 3 : 1.5;
}

/** 每城市首次被淹年份（升序前 n 个） */
export function firstFloodedCities(sim: SimResult | SimResultWithUnc, cities: CityRow[], defense: "none" | "fixed" | "adaptive", topN = 5):
  Array<{ name: string; country: string; year: number }> {
  const slr = sim.metrics.seaLevel.total;
  const out: Array<{ name: string; country: string; year: number }> = [];
  for (const c of cities) {
    if (c.elevationSource === "unknown") continue;
    const threshold = c.elevation + defenseOf(c, defense);
    for (let i = 0; i < sim.years.length; i++) {
      if (slr[i]! >= threshold) { out.push({ name: c.name, country: c.country, year: sim.years[i]! }); break; }
    }
  }
  return out.sort((a, b) => a.year - b.year).slice(0, topN);
}

export default function ComparePanel(props: { a: SimResultWithUnc; year: number }) {
  const { a } = props;
  const [bId, setBId] = useState<ScenarioId>("ssp245");
  const [b, setB] = useState<SimResult | null>(null);
  const cities = useMemo(() => loadCities(), []);
  const defense = a.experiment?.controls.coastalDefense ?? "none";
  const { locale } = useI18n();
  const en = locale === "en";
  const aLabel = a.experiment ? `${a.scenario} ${en ? "exp" : "实验"}(×${a.experiment.controls.emissionScale})` : a.scenario;

  useEffect(() => {
    let alive = true;
    import("@future-earth/engine").then((eng) => {
      if (alive) setB(eng.runScenario(bId, 2500));
    });
    return () => { alive = false; };
  }, [bId]);

  const at = (s: SimResult | SimResultWithUnc, y: number): number => {
    const i = s.years.indexOf(y);
    return i >= 0 ? i : s.years.length - 1;
  };
  const cyA = crossingYears(a.years, a.metrics.tempAnomaly);
  const cyB = b ? crossingYears(b.years, b.metrics.tempAnomaly) : undefined;
  const delta = (y: number): { dt: number; slr: number; co2: number } | null => {
    if (!b) return null;
    const i = at(a, y), j = at(b, y);
    return {
      dt: a.metrics.tempAnomaly[i]! - b.metrics.tempAnomaly[j]!,
      slr: a.metrics.seaLevel.total[i]! - b.metrics.seaLevel.total[j]!,
      co2: a.metrics.co2[i]! - b.metrics.co2[j]!,
    };
  };
  const d2100 = delta(2100), d2500 = delta(2500);
  const floodA = firstFloodedCities(a, cities, defense, 5);

  return (
    <div data-testid="compare-panel" style={{ fontSize: 16, color: "#94a3b8" }}>
      <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <b style={{ color: "#fbbf24" }}>{en ? "A: " : "A："}{aLabel}</b> vs
        {SSPS.map((id) => <button key={id} style={seg(bId === id)} aria-pressed={bId === id} onClick={() => setBId(id)}>{id}</button>)}
      </div>
      {b && (
        <Chart years={a.years} unit="°C" markerX={props.year}
          series={[
            { name: `A ${aLabel}`, color: "#fbbf24", values: a.metrics.tempAnomaly },
            { name: `B ${bId}`, color: "#38bdf8", values: a.years.map((y) => b.metrics.tempAnomaly[at(b, y)]!), dashed: true },
          ]} />
      )}
      {d2100 && d2500 && (
        <table data-testid="compare-deltas" style={{ width: "100%", borderCollapse: "collapse", margin: "8px 0", fontSize: 15 }}>
          <thead><tr>{(en ? ["Horizon", "ΔT diff (°C)", "Sea-level diff (m)", "CO₂ diff (ppm)"] : ["对比时点", "ΔT 差 (°C)", "海平面差 (m)", "CO₂ 差 (ppm)"]).map((h) => (
            <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #334155", padding: "3px 6px", color: "#cbd5e1" }}>{h}</th>
          ))}</tr></thead>
          <tbody>
            {[["2100", d2100], ["2500", d2500]].map(([label, d]) => (
              <tr key={label as string}>
                <td style={{ padding: "3px 6px" }}>{label as string}</td>
                <td style={{ padding: "3px 6px", color: (d as typeof d2100).dt <= 0 ? "#4ade80" : "#f87171" }}>{(d as typeof d2100).dt >= 0 ? "+" : ""}{(d as typeof d2100).dt.toFixed(2)}</td>
                <td style={{ padding: "3px 6px", color: (d as typeof d2100).slr <= 0 ? "#4ade80" : "#f87171" }}>{(d as typeof d2100).slr >= 0 ? "+" : ""}{(d as typeof d2100).slr.toFixed(2)}</td>
                <td style={{ padding: "3px 6px" }}>{(d as typeof d2100).co2 >= 0 ? "+" : ""}{(d as typeof d2100).co2.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <b style={{ color: "#e0f2fe" }}>{en ? "First year of exceeding temperature thresholds (A / B)" : "温度阈值首超年份（A / B）"}</b>
      <table data-testid="compare-thresholds" style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
        <thead><tr>{(en ? ["Threshold", "A", "B"] : ["阈值", "A", "B"]).map((h) => <th key={h} style={{ textAlign: "left", padding: "3px 6px", color: "#cbd5e1", borderBottom: "1px solid #334155" }}>{h}</th>)}</tr></thead>
        <tbody>{([["1.5°C", "t15"], ["2°C", "t20"], ["3°C", "t30"]] as const).map(([label, key]) => (
          <tr key={key}>
            <td style={{ padding: "3px 6px" }}>{label}</td>
            <td style={{ padding: "3px 6px" }}>{cyA[key] ?? "—"}</td>
            <td style={{ padding: "3px 6px" }}>{cyB?.[key] ?? "—"}</td>
          </tr>
        ))}</tbody>
      </table>
      <b style={{ color: "#e0f2fe", display: "block", marginTop: 8 }}>{en ? "Earliest affected cities (defense: " : "最早受影响城市（防护："}{en ? { none: "no defense", fixed: "fixed elevation", adaptive: "adaptive" }[defense] : { none: "不防护", fixed: "固定高程", adaptive: "适应" }[defense]}{en ? ")" : "）"}</b>
      {floodA.length === 0 ? <span>{en ? "No cities flooded by 2500" : "至 2500 年无城市被淹"}</span> : (
        <ol data-testid="flooded-list" style={{ margin: "4px 0", paddingLeft: 18 }}>
          {floodA.map((c) => <li key={c.name + c.year}>{c.name}{en ? ` (${c.country}) · ${c.year}` : `（${c.country}）· ${c.year}`}</li>)}
        </ol>
      )}
    </div>
  );
}
