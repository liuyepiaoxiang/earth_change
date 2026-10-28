"use client";
import { seaIceArea } from "@future-earth/engine";
import type { MetricsSnapshot, UncertaintySnapshot } from "../lib/sim";
import { tokens } from "../lib/design";
import { useI18n } from "../lib/i18n";

function Metric({
  label,
  value,
  color,
  range,
}: {
  label: string;
  value: string;
  color: string;
  range?: string;
}) {
  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "baseline" }}>
      <span style={{ color: tokens.textFaint }}>{label}</span>
      <strong style={{ color, fontVariantNumeric: "tabular-nums" }}>{value}</strong>
      {range && <span style={{ color: tokens.textDisabled, fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{range}</span>}
    </span>
  );
}

// 情景段 CO₂ 是浓度外生驱动，扰动碳汇参数不改变它——区间退化时（p10=p90）不显示
const show = (p10s: string, p90s: string) => (p90s !== p10s ? `(${p10s}–${p90s})` : undefined);
const showT = (p10: number, p90: number, d = 1) => (p90 > p10 ? `(${p10.toFixed(d)}–${p90.toFixed(d)})` : undefined);

export default function MetricsBar({
  snap,
  unc,
}: {
  snap: MetricsSnapshot | null;
  unc: UncertaintySnapshot | null;
}) {
  const { t } = useI18n();
  if (!snap) {
    return <div style={{ marginLeft: "auto", color: tokens.textDisabled, fontSize: 13 }}>—</div>;
  }
  const sl = snap.seaLevel;
  return (
    <div
      data-testid="metrics-bar"
      style={{ overflowX: "auto", 
        marginLeft: "auto",
        display: "flex",
        gap: 18,
        alignItems: "baseline",
        flexWrap: "wrap",
        fontSize: 13,
      }}
    >
      <Metric
        label="ΔT"
        value={`+${snap.tempAnomaly.toFixed(2)}°C`}
        color="#f87171"
        range={unc ? showT(unc.tempP10, unc.tempP90) : undefined}
      />
      <Metric
        label="CO₂"
        value={`${snap.co2.toFixed(0)}ppm`}
        color="#fbbf24"
        range={unc ? show(unc.co2P10.toFixed(0), unc.co2P90.toFixed(0)) : undefined}
      />
      <Metric
        label="SLR"
        value={`+${sl.total.toFixed(2)}m`}
        color="#38bdf8"
        range={unc ? showT(unc.slP10, unc.slP90, 2) : undefined}
      />
      <Metric
        label={t("metric.seaIce")}
        value={`${seaIceArea(snap.tempAnomaly).toFixed(1)}M`}
        color="#93c5fd"
        // 海冰随温度单调递减：温度 p90（更暖）→ 海冰 p10
        range={unc && unc.tempP90 > unc.tempP10 ? showT(seaIceArea(unc.tempP90), seaIceArea(unc.tempP10)) : undefined}
      />
      {snap.biomass !== undefined && (
        <Metric label={t("metric.vegetation")} value={`${((snap.biomass / 550) * 100).toFixed(0)}%`} color="#a3e635" />
      )}
      {snap.permafrost !== undefined && (
        <Metric label={t("metric.permafrost")} value={`${snap.permafrost.toFixed(0)}Gt`} color="#d8b4fe" />
      )}
      <span style={{ color: tokens.textFaint, fontSize: 12 }}>
        {t("metric.thermal")} {sl.thermal.toFixed(2)} / {t("metric.glacier")} {sl.glacier.toFixed(2)} / {t("metric.iceSheet")} {sl.iceSheet.toFixed(2)} / {t("metric.landWater")}{" "}
        {sl.landWater.toFixed(2)} m
      </span>
    </div>
  );
}
