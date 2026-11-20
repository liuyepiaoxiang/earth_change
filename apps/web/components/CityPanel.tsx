"use client";
import { useMemo, useState } from "react";
import { classifyBiome, isCityFlooded, localDTs, scaledPrecip, urbanHeatIsland } from "@future-earth/engine";
import type { WarmingPatternBand } from "@future-earth/engine";
import type { CityRow } from "@future-earth/data";
import type { MetricsSnapshot, SimResultWithUnc } from "../lib/sim";
import { panelStyle, tokens } from "../lib/design";
import { useI18n } from "../lib/i18n";
import { biomeName } from "../lib/biome-i18n";
import Sparkline from "./Sparkline";
import { generateCityCard } from "../lib/city-card";

/** 高程 → 淹没风险分档（与 /city/[slug] SEO 页同口径：<2 危急 / <5 高 / <20 中 / 其余低） */
function riskBand(elevation: number): { key: "critical" | "high" | "moderate" | "low"; color: string } {
  if (elevation < 2) return { key: "critical", color: "#f87171" };
  if (elevation < 5) return { key: "high", color: "#fbbf24" };
  if (elevation < 20) return { key: "moderate", color: "#94a3b8" };
  return { key: "low", color: "#4ade80" };
}

/** 热门高风险城市 chips：数据驱动（数据集按人口降序，取高程 <10m 的前 8 个），避免硬编码名单与数据集失配 */

/** 卡片分区入场 stagger（reduced-motion 下 animations.css 全量降级为无动画） */
const rise = (delay: number): React.CSSProperties => ({
  animation: `fe-card-rise 0.45s cubic-bezier(0.22, 0.61, 0.36, 1) both`,
  animationDelay: `${delay}s`,
});

export default function CityPanel({
  city,
  snap,
  sim,
  year,
  cities,
  onSelectCity,
  pattern,
  onClose,
}: {
  city: CityRow;
  snap: MetricsSnapshot;
  sim: SimResultWithUnc;
  year: number;
  cities: CityRow[];
  onSelectCity: (c: CityRow) => void;
  pattern: WarmingPatternBand[];
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const pat = pattern.length ? pattern : undefined;
  const dtLocal = localDTs(snap.tempAnomaly, city.lat, pat);
  const uhi = urbanHeatIsland(city.population); // eq_54 城市热岛（当代城市属性，不随情景演化）
  const tFuture = city.tbase + dtLocal + uhi;
  const pFuture = scaledPrecip(city.pbase, snap.tempAnomaly);
  const elevationKnown = city.elevationSource !== "unknown";
  const flooded = elevationKnown && isCityFlooded(city.elevation, snap.seaLevel.total);
  const biome = classifyBiome(tFuture, pFuture);
  const popText = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en", { notation: "compact" }).format(city.population);
  const risk = riskBand(city.elevation);

  // 城市级时间序列（整条 sim 逐年派生）：年均温与淹没余量
  const { years, tempSeries, marginSeries, firstFlood } = useMemo(() => {
    const ys = sim.years;
    const temps: Array<number | null> = [];
    const margins: Array<number | null> = [];
    for (let i = 0; i < ys.length; i++) {
      const dT = sim.metrics.tempAnomaly[i];
      const slr = sim.metrics.seaLevel.total[i];
      temps.push(dT === undefined || slr === undefined ? null : city.tbase + localDTs(dT, city.lat, pat) + uhi);
      margins.push(slr === undefined ? null : city.elevation - slr);
    }
    // 首淹年份：情景段（>2025）首个高程 ≤ SLR 的年份
    let flood: number | null = null;
    for (let i = 0; i < ys.length; i++) {
      if (ys[i]! > 2025 && sim.metrics.seaLevel.total[i] !== undefined && isCityFlooded(city.elevation, sim.metrics.seaLevel.total[i]!)) {
        flood = ys[i]!;
        break;
      }
    }
    return { years: ys, tempSeries: temps, marginSeries: margins, firstFlood: flood };
  }, [sim, city, pat, uhi]);

  const featured = useMemo(
    () => cities.filter((c) => c.elevationSource !== "unknown" && c.elevation < 10 && c.name !== city.name).slice(0, 8),
    [cities, city.name],
  );
  const results = query.trim()
    ? cities.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];

  const metricLabel: React.CSSProperties = { color: tokens.textFaint };
  const metricValue = (color?: string): React.CSSProperties => ({ color: color ?? tokens.text, fontWeight: 600, fontVariantNumeric: "tabular-nums" });

  return (
    <div
      className="fe-slide-in"
      style={{
        position: "absolute",
        left: 16,
        bottom: 16,
        width: 340,
        padding: "12px 14px",
        ...panelStyle,
        border: `1px solid ${tokens.panelBorder}`,
        fontSize: 13,
        lineHeight: 1.7,
        maxHeight: "calc(100% - 32px)",
        overflowY: "auto",
      }}
    >
      <div style={{ ...rise(0), display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <strong style={{ fontSize: 15, color: tokens.textStrong }}>
          {city.name}
          <span style={{ color: tokens.textFaint, fontWeight: 400, fontSize: 12 }}>（{city.country}）</span>
        </strong>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {elevationKnown && (
            <span
              style={{ fontSize: 11, padding: "1px 8px", borderRadius: 999, border: `1px solid ${risk.color}66`, color: risk.color, background: `${risk.color}14` }}
              aria-label={t(`city.risk.${risk.key}`)}
            >
              {t(`city.risk.${risk.key}`)}
            </span>
          )}
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: tokens.textFaint, cursor: "pointer", fontSize: 14 }}
            aria-label={t("city.close")}
          >
            ✕
          </button>
        </div>
      </div>

      <div style={{ ...rise(0.05), color: flooded ? "#38bdf8" : "#eab308", marginBottom: 2 }}>
        {!elevationKnown ? t("city.elevUnknown") : flooded ? t("city.flooded") : t("city.safe")}（{t("city.elevation")} {city.elevation} m vs SLR +{snap.seaLevel.total.toFixed(2)} m）
      </div>
      <div style={{ ...rise(0.05), color: tokens.textMuted, fontSize: 12, marginBottom: 6 }}>
        {t("city.firstFlood")}：{elevationKnown ? (firstFlood !== null ? <strong style={{ color: "#f87171" }}>{firstFlood}</strong> : t("city.firstFlood.none")) : "—"}
      </div>

      <div style={{ ...rise(0.1), marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: tokens.textFaint }}>{t("city.tempSeries")}</div>
        <Sparkline years={years} values={tempSeries} color="#f87171" unit="°C" markerYear={year} ariaLabel={t("city.tempSeries")} />
      </div>
      <div style={{ ...rise(0.15), marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: tokens.textFaint }}>{t("city.marginSeries")}</div>
        <Sparkline years={years} values={marginSeries} color="#38bdf8" unit="m" markerYear={year} dangerBelow={0} ariaLabel={t("city.marginSeries")} />
      </div>

      <div style={{ ...rise(0.2), display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", marginBottom: 8 }}>
        <div>
          <span style={metricLabel}>{t("city.localWarming")}</span>{" "}
          <strong style={metricValue("#f87171")}>+{dtLocal.toFixed(2)}°C</strong>
          <span style={{ color: tokens.textFaint }}>（{t("city.global")} +{snap.tempAnomaly.toFixed(2)}）</span>
        </div>
        <div>
          <span style={metricLabel}>{t("city.uhi")}</span> <strong style={metricValue("#fb923c")}>+{uhi.toFixed(1)}°C</strong>
          <span style={{ color: tokens.textFaint }}>（{popText}）</span>
        </div>
        <div>
          <span style={metricLabel}>{t("city.annualTemp")}</span> <strong style={metricValue()}>{tFuture.toFixed(1)}°C</strong>
          <span style={{ color: tokens.textFaint }}>（{t("city.baseline")} {city.tbase.toFixed(1)}）</span>
        </div>
        <div>
          <span style={metricLabel}>{t("city.precip")}</span> <strong style={metricValue()}>{pFuture.toFixed(0)}mm</strong>
          <span style={{ color: tokens.textFaint }}>（{city.pbase.toFixed(0)}）</span>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <span style={metricLabel}>{t("city.biome")}</span> <strong style={{ color: "#a3e635" }}>{biomeName(biome, locale)}</strong>
        </div>
      </div>

      <div style={{ ...rise(0.25), borderTop: `1px solid ${tokens.panelBorder}`, paddingTop: 8 }}>
        <button
          onClick={() => generateCityCard({ city, sim, pattern: pattern.length ? pattern : [], firstFlood, year }, locale === "en" ? "en" : "zh")}
          style={{ width: "100%", marginBottom: 10, padding: "8px 0", fontSize: 13, borderRadius: tokens.radiusSm, border: `1px solid ${tokens.accent}55`, background: "rgba(56,189,248,0.10)", color: tokens.accent, cursor: "pointer", fontWeight: 600 }}
        >
          🖼 {t("city.shareCard")}
        </button>
        <div style={{ fontSize: 11, color: tokens.textFaint, marginBottom: 4 }}>{t("city.switchCity")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
          {featured.map((c) => (
            <button
              key={c.name}
              onClick={() => onSelectCity(c)}
              style={{ padding: "2px 8px", fontSize: 12, borderRadius: 999, cursor: "pointer", background: "rgba(56,189,248,0.08)", border: `1px solid ${tokens.panelBorder}`, color: tokens.textMuted }}
            >
              {c.name}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("city.searchPlaceholder")}
          aria-label={t("city.searchPlaceholder")}
          style={{ width: "100%", boxSizing: "border-box", padding: "4px 8px", fontSize: 12, borderRadius: tokens.radiusSm, border: `1px solid ${tokens.panelBorder}`, background: "rgba(7,11,20,0.6)", color: tokens.text, outline: "none" }}
        />
        {results.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {results.map((c) => (
              <button
                key={`${c.name}-${c.lat}`}
                onClick={() => { onSelectCity(c); setQuery(""); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "3px 8px", fontSize: 12, cursor: "pointer", background: "none", border: "none", color: tokens.textMuted }}
              >
                {c.name} <span style={{ color: tokens.textFaint }}>（{c.country}）</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
