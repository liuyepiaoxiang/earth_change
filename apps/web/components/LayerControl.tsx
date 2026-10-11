"use client";

export interface LayerState {
  temperature: boolean;
  cities: boolean;
  basemap: boolean;
  atmosphere: boolean;
}

export const DEFAULT_LAYERS: LayerState = {
  temperature: true,
  cities: true,
  basemap: true,
  atmosphere: true,
};

const ITEMS: Array<{ key: keyof LayerState; label: string; color: string }> = [
  { key: "temperature", label: "温度点云", color: "#26e74d" },
  { key: "cities", label: "城市点", color: "#eab308" },
  { key: "basemap", label: "卫星底图", color: "#8b6f47" },
  { key: "atmosphere", label: "大气辉光", color: "#5b7fa6" },
];

export default function LayerControl({
  layers,
  onToggle,
}: {
  layers: LayerState;
  onToggle: (key: keyof LayerState) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        width: 148,
        padding: "8px 10px",
        borderRadius: 10,
        background: "rgba(8, 15, 30, 0.85)",
        border: "1px solid #1e293b",
        backdropFilter: "blur(4px)",
      }}
    >
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>图层（点击切换）</div>
      {ITEMS.map((it) => {
        const on = layers[it.key];
        return (
          <button
            key={it.key}
            onClick={() => onToggle(it.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "5px 8px",
              marginBottom: 4,
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              textAlign: "left",
              border: `1px solid ${on ? "#334155" : "#1e293b"}`,
              background: on ? "rgba(30, 41, 59, 0.9)" : "transparent",
              color: on ? "#e2e8f0" : "#475569",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                flexShrink: 0,
                background: on ? it.color : "#334155",
              }}
            />
            {it.label}
            <span style={{ marginLeft: "auto", fontSize: 10, color: on ? "#64748b" : "#334155" }}>
              {on ? "显示中" : "已隐藏"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
