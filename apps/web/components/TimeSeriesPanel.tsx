"use client";
/** V02：可切换时间序列（温度/CO₂/海平面/冻土/植被），温度与海平面叠加 MC p10-p90 阴影 */
import { useState } from "react";
import Chart from "./Chart";
import { useI18n } from "../lib/i18n";
import type { SimResultWithUnc } from "../lib/sim";

// 内部 key 用中文，展示时按 locale 翻译
const TABS = ["温度", "CO₂", "海平面", "冻土碳", "植被生物量"] as const;
const TABS_EN: Record<(typeof TABS)[number], string> = {
  "温度": "Temperature", "CO₂": "CO₂", "海平面": "Sea level", "冻土碳": "Permafrost carbon", "植被生物量": "Vegetation biomass",
};
const btn = (on: boolean): React.CSSProperties => ({
  padding: "3px 10px", fontSize: 12, borderRadius: 6, cursor: "pointer",
  border: `1px solid ${on ? "#38bdf8" : "#334155"}`, background: on ? "#0c4a6e" : "transparent", color: on ? "#e0f2fe" : "#94a3b8",
});

export default function TimeSeriesPanel({ sim, markerX }: { sim: SimResultWithUnc; markerX?: number }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("温度");
  const { locale } = useI18n();
  const en = locale === "en";
  const u = sim.uncertainty;
  const m = sim.metrics;
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }} role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} style={btn(tab === t)} onClick={() => setTab(t)}>{en ? TABS_EN[t] : t}</button>
        ))}
      </div>
      {tab === "温度" && (
        <Chart years={sim.years} unit="°C" markerX={markerX}
          band={u ? { color: "#f87171", p10: u.tempAnomaly.p10, p90: u.tempAnomaly.p90 } : undefined}
          series={[{ name: en ? "Global ΔT" + (u ? " (p10–p90)" : "") : "全球 ΔT" + (u ? "（含 p10-p90）" : ""), color: "#f87171", values: m.tempAnomaly }]} />
      )}
      {tab === "CO₂" && (
        <Chart years={sim.years} unit="ppm" markerX={markerX}
          band={u ? { color: "#4ade80", p10: u.co2.p10, p90: u.co2.p90 } : undefined}
          series={[{ name: en ? "Atmospheric CO₂" : "大气 CO₂", color: "#4ade80", values: m.co2 }]} />
      )}
      {tab === "海平面" && (
        <Chart years={sim.years} unit="m" markerX={markerX}
          band={u ? { color: "#38bdf8", p10: u.seaLevel.p10, p90: u.seaLevel.p90 } : undefined}
          series={[{ name: en ? "Sea-level rise" : "海平面上升", color: "#38bdf8", values: m.seaLevel.total }]} />
      )}
      {tab === "冻土碳" && m.permafrost && (
        <Chart years={sim.years} unit="GtC" markerX={markerX}
          series={[{ name: en ? "Permafrost carbon pool" : "多年冻土碳库", color: "#22d3ee", values: m.permafrost }]} />
      )}
      {tab === "植被生物量" && m.biomass && (
        <Chart years={sim.years} unit="GtC" markerX={markerX}
          series={[{ name: en ? "Vegetation biomass" : "植被生物量", color: "#4ade80", values: m.biomass }]} />
      )}
    </div>
  );
}
