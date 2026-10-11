"use client";
import { classifyBiome, isCityFlooded, localDTs, scaledPrecip } from "@future-earth/engine";
import type { WarmingPatternBand } from "@future-earth/engine";
import type { CityRow } from "@future-earth/data";
import type { MetricsSnapshot } from "../lib/sim";

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
      style={{
        position: "absolute",
        left: 16,
        bottom: 16,
        width: 260,
        padding: "12px 14px",
        borderRadius: 10,
        background: "rgba(8, 15, 30, 0.88)",
        border: "1px solid #1e293b",
        backdropFilter: "blur(4px)",
        fontSize: 13,
        lineHeight: 1.7,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <strong style={{ fontSize: 15, color: "#e0f2fe" }}>
          {city.name}
          <span style={{ color: "#64748b", fontWeight: 400, fontSize: 12 }}>（{city.country}）</span>
        </strong>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14 }}
          aria-label="关闭城市面板"
        >
          ✕
        </button>
      </div>
      <div style={{ color: flooded ? "#38bdf8" : "#eab308" }}>
        {flooded ? "⚠ 已被海平面淹没" : "未淹没"}（高程 {city.elevation} m vs SLR +{snap.seaLevel.total.toFixed(2)} m）
      </div>
      <div style={{ color: "#94a3b8" }}>
        本地升温 <strong style={{ color: "#f87171" }}>+{dtLocal.toFixed(2)}°C</strong>（全球 +{snap.tempAnomaly.toFixed(2)}°C）
      </div>
      <div style={{ color: "#94a3b8" }}>
        年均温 <strong style={{ color: "#e2e8f0" }}>{tFuture.toFixed(1)}°C</strong>（基准 {city.tbase.toFixed(1)}°C）
      </div>
      <div style={{ color: "#94a3b8" }}>
        年降水 <strong style={{ color: "#e2e8f0" }}>{pFuture.toFixed(0)}mm</strong>（基准 {city.pbase.toFixed(0)}mm）
      </div>
      <div style={{ color: "#94a3b8" }}>
        群系 <strong style={{ color: "#a3e635" }}>{biome}</strong>
      </div>
    </div>
  );
}
