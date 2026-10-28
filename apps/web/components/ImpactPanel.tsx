"use client";
/** V2.0 影响面板：8 影响指标 + 适应三档对比 + 公式/来源/越界警告（I-04/I-05 UI 侧） */
import { useMemo, useState } from "react";
import { runImpacts } from "@future-earth/engine";
import type { AdaptationLevel } from "@future-earth/engine";
import { loadCities } from "@future-earth/data";
import type { SimResultWithUnc } from "../lib/sim";
import { useI18n } from "../lib/i18n";

const LEVELS: Array<[AdaptationLevel, string, string]> = [
  ["none", "无适应", "No adaptation"], ["medium", "中等适应", "Medium adaptation"], ["high", "高适应", "High adaptation"],
];
const seg = (on: boolean): React.CSSProperties => ({
  padding: "2px 8px", fontSize: 15, cursor: "pointer", border: `1px solid ${on ? "#38bdf8" : "#334155"}`,
  background: on ? "#0c4a6e" : "transparent", color: on ? "#e0f2fe" : "#94a3b8",
});
const card: React.CSSProperties = { border: "1px solid #1e293b", borderRadius: 8, padding: 10, marginBottom: 8, background: "#0f172a" };
const warn: React.CSSProperties = { color: "#f59e0b", fontSize: 15 };

function ImpactCard(props: { title: string; value: string; sub?: string; formula: string; source: string; range: string; warnings: string[] }) {
  const { locale } = useI18n();
  const en = locale === "en";
  return (
    <div style={card} data-testid={`impact-${props.title}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <b style={{ color: "#e0f2fe" }}>{props.title}</b>
        <span style={{ color: "#fbbf24", fontSize: 16, fontVariantNumeric: "tabular-nums" }}>{props.value}</span>
      </div>
      {props.sub && <div style={{ color: "#94a3b8", fontSize: 15, marginTop: 2 }}>{props.sub}</div>}
      {props.warnings.map((w) => <div key={w} style={warn}>⚠ {w}</div>)}
      <details style={{ marginTop: 4, fontSize: 16, color: "#475569" }}>
        <summary>{en ? "Formula / source / range" : "公式/来源/范围"}</summary>
        <div>{props.formula}</div><div>{en ? "Source: " : "来源："}{props.source}</div><div>{en ? "Applies to: " : "适用："}{props.range}</div>
      </details>
    </div>
  );
}

const STRESS_EN: Record<string, string> = { "低": "low", "中": "medium", "高": "high", "极高": "extreme" };
const SUIT_EN: Record<string, string> = { "改善": "improving", "稳定": "stable", "恶化": "degrading" };

export default function ImpactPanel(props: { sim: SimResultWithUnc; year: number }) {
  const [adaptation, setAdaptation] = useState<AdaptationLevel>("none");
  const { locale } = useI18n();
  const en = locale === "en";
  const cities = useMemo(() => loadCities(), []);
  const imp = useMemo(() => runImpacts(props.sim, props.year, cities, adaptation), [props.sim, props.year, cities, adaptation]);
  const fmtPop = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : String(n);

  return (
    <div data-testid="impact-panel" style={{ fontSize: 16 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {LEVELS.map(([v, zh, eng]) => <button key={v} style={seg(adaptation === v)} onClick={() => setAdaptation(v)}>{en ? eng : zh}</button>)}
      </div>
      <ImpactCard title={en ? "Exposed population" : "暴露人口"} value={fmtPop(imp.exposure.exposedPopulation)}
        sub={en ? `${imp.exposure.floodedCount} cities flooded (with defenses)` : `${imp.exposure.floodedCount} 城市被淹（含防护）`}
        formula={imp.exposure.meta.formula} source={imp.exposure.meta.source} range={imp.exposure.meta.validRange} warnings={imp.exposure.meta.warnings} />
      <ImpactCard title={en ? "Water resources per capita" : "人均水资源"} value={`${imp.water.perCapitaM3} m³/yr`}
        sub={en ? `${STRESS_EN[imp.water.stressLevel] ?? imp.water.stressLevel} water stress (Falkenmark)` : `${imp.water.stressLevel}水压力（Falkenmark）`}
        formula={imp.water.meta.formula} source={imp.water.meta.source} range={imp.water.meta.validRange} warnings={imp.water.meta.warnings} />
      <ImpactCard title={en ? "Extreme heat" : "极端高温"} value={en ? `${imp.heat.heatwaveDays} days/yr` : `${imp.heat.heatwaveDays} 天/yr`}
        sub={imp.heat.deltaDays > 0 ? `+${imp.heat.deltaDays} vs 2024` : `${imp.heat.deltaDays} vs 2024`}
        formula={imp.heat.meta.formula} source={imp.heat.meta.source} range={imp.heat.meta.validRange} warnings={imp.heat.meta.warnings} />
      <ImpactCard title={en ? "Agricultural suitability" : "农业适宜度"} value={en ? (SUIT_EN[imp.agriculture.suitability] ?? imp.agriculture.suitability) : imp.agriculture.suitability}
        sub={en ? `GDD ${imp.agriculture.growingDegreeDays}°C·d · Water ${imp.agriculture.waterBalance}mm` : `GDD ${imp.agriculture.growingDegreeDays}°C·d · 水分 ${imp.agriculture.waterBalance}mm`}
        formula={imp.agriculture.meta.formula} source={imp.agriculture.meta.source} range={imp.agriculture.meta.validRange} warnings={imp.agriculture.meta.warnings} />
      <ImpactCard title={en ? "Ecological shift" : "生态迁移"} value={`${imp.ecology.biomeShift}%`}
        sub={en ? "Biome change (vs 2024)" : "群系改变（vs 2024）"}
        formula={imp.ecology.meta.formula} source={imp.ecology.meta.source} range={imp.ecology.meta.validRange} warnings={imp.ecology.meta.warnings} />
      <ImpactCard title={en ? "Ocean acidification" : "海洋酸化"} value={`pH ${imp.oceanAcid.ph}`}
        sub={imp.oceanAcid.ph < 7.8 ? (en ? "Severe threat to coral reefs" : "珊瑚礁严重威胁") : (en ? "Changing" : "变化中")}
        formula={imp.oceanAcid.meta.formula} source={imp.oceanAcid.meta.source} range={imp.oceanAcid.meta.validRange} warnings={imp.oceanAcid.meta.warnings} />
      <ImpactCard title={en ? "Economic damage" : "经济损害"} value={`${imp.damage.gdpLossPct}%`}
        sub={en ? `Global GDP loss (${adaptation === "none" ? "no adaptation" : adaptation === "medium" ? "medium adaptation" : "high adaptation"})` : `全球 GDP 损失（${adaptation === "none" ? "无适应" : adaptation === "medium" ? "中等适应" : "高适应"}）`}
        formula={imp.damage.meta.formula} source={imp.damage.meta.source} range={imp.damage.meta.validRange} warnings={imp.damage.meta.warnings} />
      <ImpactCard title={en ? "Social cost of carbon" : "碳社会成本"} value={`$${imp.scc.scc}/tCO₂`}
        sub={en ? "Educational estimate (discount-rate sensitive)" : "教育性估计（折现率敏感）"}
        formula={imp.scc.meta.formula} source={imp.scc.meta.source} range={imp.scc.meta.validRange} warnings={imp.scc.meta.warnings} />
    </div>
  );
}
