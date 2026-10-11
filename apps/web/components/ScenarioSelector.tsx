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
    <div style={{ display: "flex", gap: 6 }}>
      {SCENARIOS.map((s) => {
        const active = value === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
              border: `1px solid ${active ? "#38bdf8" : "#334155"}`,
              background: active ? "#0c4a6e" : "transparent",
              color: active ? "#e0f2fe" : "#94a3b8",
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
