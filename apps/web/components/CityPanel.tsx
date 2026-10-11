"use client";
import { classifyBiome, isCityFlooded, localDTs, scaledPrecip } from "@future-earth/engine";
import type { WarmingPatternBand } from "@future-earth/engine";
import type { CityRow } from "@future-earth/data";
import type { MetricsSnapshot } from "../lib/sim";
import { panelStyle, tokens } from "../lib/design";

export default function CityPanel({
  city,
  snap,
  pattern,
  onClose,
}: {
  city: CityRow;
  snap: MetricsSnapshot;
  pattern: WarmingPatternBand[];
  onClose: () => void;
}) {
  const dtLocal = localDTs(snap.tempAnomaly, city.lat, pattern.length ? pattern : undefined);
  const tFuture = city.tbase + dtLocal;
  const pFuture = scaledPrecip(city.pbase, snap.tempAnomaly);
  const flooded = isCityFlooded(city.elevation, snap.seaLevel.total);
  const biome = classifyBiome(tFuture, pFuture);

  return (
    <div
      className="fe-slide-in"
      style={{
        position: "absolute",
        left: 16,
        bottom: 16,
        width: 260,
        padding: "12px 14px",
        ...panelStyle,
        border: `1px solid ${tokens.panelBorder}`,
        fontSize: 13,
        lineHeight: 1.7,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <strong style={{ fontSize: 15, color: tokens.textStrong }}>
          {city.name}
          <span style={{ color: tokens.textFaint, fontWeight: 400, fontSize: 12 }}>（{city.country}）</span>
        </strong>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: tokens.textFaint, cursor: "pointer", fontSize: 14 }}
          aria-label="关闭城市面板"
        >
          ✕
        </button>
      </div>
      <div style={{ color: flooded ? "#38bdf8" : "#eab308" }}>
        {flooded ? "⚠ 已被海平面淹没" : "未淹没"}（高程 {city.elevation} m vs SLR +{snap.seaLevel.total.toFixed(2)} m）
      </div>
      <div style={{ color: tokens.textMuted }}>
        本地升温 <strong style={{ color: "#f87171" }}>+{dtLocal.toFixed(2)}°C</strong>（全球 +{snap.tempAnomaly.toFixed(2)}°C）
      </div>
      <div style={{ color: tokens.textMuted }}>
        年均温 <strong style={{ color: tokens.text }}>{tFuture.toFixed(1)}°C</strong>（基准 {city.tbase.toFixed(1)}°C）
      </div>
      <div style={{ color: tokens.textMuted }}>
        年降水 <strong style={{ color: tokens.text }}>{pFuture.toFixed(0)}mm</strong>（基准 {city.pbase.toFixed(0)}mm）
      </div>
      <div style={{ color: tokens.textMuted }}>
        群系 <strong style={{ color: "#a3e635" }}>{biome}</strong>
      </div>
    </div>
  );
}
