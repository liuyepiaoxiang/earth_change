"use client";
import type { ScenarioId } from "@future-earth/engine";

const SCENARIOS: Array<{ id: ScenarioId; label: string }> = [
  { id: "ssp126", label: "SSP1-2.6" },
  { id: "ssp245", label: "SSP2-4.5" },
  { id: "ssp370", label: "SSP3-7.0" },
  { id: "ssp585", label: "SSP5-8.5" },
];

export default function ScenarioSelector({
  value,
  onChange,
}: {
  value: ScenarioId;
  onChange: (s: ScenarioId) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 9, background: "rgba(148, 163, 184, 0.08)", border: "1px solid rgba(148, 163, 184, 0.14)" }}>
      {SCENARIOS.map((s) => {
        const active = value === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            style={{
              padding: "4px 11px",
              borderRadius: 7,
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "inherit",
              fontVariantNumeric: "tabular-nums",
              border: `1px solid ${active ? "#2563eb" : "transparent"}`,
              background: active ? "#1d4ed8" : "transparent",
              color: active ? "#ffffff" : "#94a3b8",
              fontWeight: active ? 600 : 400,
              boxShadow: active ? "0 2px 12px rgba(37, 99, 235, 0.45)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
