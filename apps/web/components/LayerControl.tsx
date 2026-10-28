"use client";
import { panelStyle, tokens } from "../lib/design";
import { useI18n, type TranslationKey } from "../lib/i18n";

export interface LayerState {
  temperature: boolean;
  cities: boolean;
  basemap: boolean;
  atmosphere: boolean;
  flood: boolean;
  prec: boolean;
}

export const DEFAULT_LAYERS: LayerState = {
  temperature: true,
  cities: true,
  basemap: true,
  atmosphere: true,
  flood: true,
  prec: false, // 着色类图层默认关（与温度场叠加视觉嘈杂）
};

const ITEMS: Array<{ key: keyof LayerState; labelKey: TranslationKey; color: string }> = [
  { key: "temperature", labelKey: "layer.temperature", color: "#26e74d" },
  { key: "cities", labelKey: "layer.cities", color: "#eab308" },
  { key: "flood", labelKey: "layer.flood", color: "#38bdf8" },
  { key: "prec", labelKey: "layer.prec", color: "#84cc16" },
  { key: "basemap", labelKey: "layer.basemap", color: "#8b6f47" },
  { key: "atmosphere", labelKey: "layer.atmosphere", color: "#5b7fa6" },
];

export default function LayerControl({
  layers,
  onToggle,
}: {
  layers: LayerState;
  onToggle: (key: keyof LayerState) => void;
}) {
  const { t } = useI18n();
  return (
    <div
      className="fe-fade-up"
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        width: 148,
        padding: "8px 10px",
        borderRadius: 10,
        background: "rgba(8, 15, 30, 0.85)",
        border: `1px solid ${tokens.panelBorder}`,
        backdropFilter: "blur(4px)",
      }}
    >
      <div style={{ fontSize: 11, color: tokens.textFaint, marginBottom: 6 }}>{t("layer.title")}</div>
      {ITEMS.map((it) => {
        const on = layers[it.key];
        return (
          <button
            key={it.key}
            className="fe-layer-btn"
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
            {t(it.labelKey)}
            <span style={{
              marginLeft: "auto", fontSize: 10, padding: "1px 8px", borderRadius: 8,
              color: on ? "#4ade80" : "#475569",
              background: on ? "rgba(74, 222, 128, 0.12)" : "rgba(71, 85, 105, 0.18)",
              border: `1px solid ${on ? "rgba(74, 222, 128, 0.35)" : "rgba(71, 85, 105, 0.3)"}`,
            }}>
              {on ? t("layer.on") : t("layer.off")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
