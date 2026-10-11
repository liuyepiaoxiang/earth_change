"use client";

export default function Timeline({
  year,
  onChange,
  disabled,
}: {
  year: number;
  onChange: (y: number) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
      <span style={{ fontSize: 12, color: "#64748b" }}>2026</span>
      <input
        type="range"
        min={2026}
        max={2500}
        step={1}
        value={year}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: "#38bdf8" }}
      />
      <span style={{ fontSize: 12, color: "#64748b" }}>2500</span>
      <strong style={{ minWidth: 52, textAlign: "center", color: "#e0f2fe", fontVariantNumeric: "tabular-nums" }}>
        {year}
      </strong>
    </div>
  );
}
