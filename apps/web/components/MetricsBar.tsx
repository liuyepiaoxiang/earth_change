"use client";
import type { MetricsSnapshot } from "../lib/sim";

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "baseline" }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <strong style={{ color, fontVariantNumeric: "tabular-nums" }}>{value}</strong>
    </span>
  );
}

export default function MetricsBar({ snap }: { snap: MetricsSnapshot | null }) {
  if (!snap) {
    return <div style={{ marginLeft: "auto", color: "#475569", fontSize: 13 }}>—</div>;
  }
  const sl = snap.seaLevel;
  return (
    <div
      style={{
        marginLeft: "auto",
        display: "flex",
        gap: 18,
        alignItems: "baseline",
        flexWrap: "wrap",
        fontSize: 13,
      }}
    >
      <Metric label="ΔT" value={`+${snap.tempAnomaly.toFixed(2)}°C`} color="#f87171" />
      <Metric label="CO₂" value={`${snap.co2.toFixed(0)}ppm`} color="#fbbf24" />
      <Metric label="SLR" value={`+${sl.total.toFixed(2)}m`} color="#38bdf8" />
      <span style={{ color: "#64748b", fontSize: 12 }}>
        热膨 {sl.thermal.toFixed(2)} / 冰川 {sl.glacier.toFixed(2)} / 冰盖 {sl.iceSheet.toFixed(2)} / 陆水{" "}
        {sl.landWater.toFixed(2)} m
      </span>
    </div>
  );
}
