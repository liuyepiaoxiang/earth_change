"use client";
import { classifyBiome, isCityFlooded, localDTs, scaledPrecip } from "@future-earth/engine";
import type { WarmingPatternBand } from "@future-earth/engine";
import type { CityRow } from "@future-earth/data";
import type { MetricsSnapshot } from "../lib/sim";
import { panelStyle, tokens } from "../lib/design";
import { useI18n } from "../lib/i18n";

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
  const { t } = useI18n();
  const dtLocal = localDTs(snap.tempAnomaly, city.lat, pattern.length ? pattern : undefined);
  const tFuture = city.tbase + dtLocal;
  const pFuture = scaledPrecip(city.pbase, snap.tempAnomaly);
  const elevationKnown = city.elevationSource !== "unknown";
  const flooded = elevationKnown && isCityFlooded(city.elevation, snap.seaLevel.total);
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
          aria-label={t("city.close")}
        >
          ✕
        </button>
      </div>
      <div style={{ color: flooded ? "#38bdf8" : "#eab308" }}>
        {!elevationKnown ? t("city.elevUnknown") : flooded ? t("city.flooded") : t("city.safe")}（{t("city.elevation")} {city.elevation} m vs SLR +{snap.seaLevel.total.toFixed(2)} m）
      </div>
      <div style={{ color: tokens.textMuted }}>
        {t("city.localWarming")} <strong style={{ color: "#f87171" }}>+{dtLocal.toFixed(2)}°C</strong>（{t("city.global")} +{snap.tempAnomaly.toFixed(2)}°C）
      </div>
      <div style={{ color: tokens.textMuted }}>
        {t("city.annualTemp")} <strong style={{ color: tokens.text }}>{tFuture.toFixed(1)}°C</strong>（{t("city.baseline")} {city.tbase.toFixed(1)}°C）
      </div>
      <div style={{ color: tokens.textMuted }}>
        {t("city.precip")} <strong style={{ color: tokens.text }}>{pFuture.toFixed(0)}mm</strong>（{t("city.baseline")} {city.pbase.toFixed(0)}mm）
      </div>
      <div style={{ color: tokens.textMuted }}>
        {t("city.biome")} <strong style={{ color: "#a3e635" }}>{biome}</strong>
      </div>
    </div>
  );
}
