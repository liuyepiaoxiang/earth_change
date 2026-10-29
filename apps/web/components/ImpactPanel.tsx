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

type ImpactMeta = {
  formula: string; formulaEn?: string;
  source: string; sourceEn?: string;
  validRange: string; validRangeEn?: string;
  warnings: string[];
};

function ImpactCard(props: { title: string; value: string; sub?: string; meta: ImpactMeta }) {
  const { locale } = useI18n();
  const en = locale === "en";
  const m = props.meta;
  const formula = en && m.formulaEn ? m.formulaEn : m.formula;
  const source = en && m.sourceEn ? m.sourceEn : m.source;
  const range = en && m.validRangeEn ? m.validRangeEn : m.validRange;
  return (
    <div style={card} data-testid={`impact-${props.title}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <b style={{ color: "#e0f2fe" }}>{props.title}</b>
        <span style={{ color: "#fbbf24", fontSize: 16, fontVariantNumeric: "tabular-nums" }}>{props.value}</span>
      </div>
      {props.sub && <div style={{ color: "#94a3b8", fontSize: 15, marginTop: 2 }}>{props.sub}</div>}
      {m.warnings.map((w) => <div key={w} style={warn}>⚠ {en ? (WARN_EN[w] ?? w) : w}</div>)}
      <details style={{ marginTop: 4, fontSize: 16, color: "#475569" }}>
        <summary>{en ? "Formula / source / range" : "公式/来源/范围"}</summary>
        <div>{formula}</div><div>{en ? "Source: " : "来源："}{source}</div><div>{en ? "Applies to: " : "适用："}{range}</div>
      </details>
    </div>
  );
}

const STRESS_EN: Record<string, string> = { "低": "low", "中": "medium", "高": "high", "极高": "extreme" };
/** engine impact meta.warnings 中文枚举 → 英文 */
const WARN_EN: Record<string, string> = {
  "2100 年后为探索性外推": "Exploratory extrapolation beyond 2100",
  "ΔT > 6°C：超出经验拟合范围": "ΔT > 6°C: beyond empirical fit range",
  "ΔT > 5°C：农业系统可能发生非线性响应": "ΔT > 5°C: agriculture may respond nonlinearly",
  "群系改变 > 50%：可能跨越临界点": "Biome shift > 50%: possible tipping-point crossing",
  "pH < 7.7：深海生态系统可能大面积受损": "pH < 7.7: deep-sea ecosystems may be widely damaged",
  "ΔT > 5°C：损害函数外推不确定度极大": "ΔT > 5°C: damage-function extrapolation is highly uncertain",
  "碳社会成本对折现率高度敏感——本值为教育性估计": "SCC is highly sensitive to the discount rate — educational estimate only",
};
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
        meta={imp.exposure.meta} />
      <ImpactCard title={en ? "Water resources per capita" : "人均水资源"} value={`${imp.water.perCapitaM3} m³/yr`}
        sub={en ? `${STRESS_EN[imp.water.stressLevel] ?? imp.water.stressLevel} water stress (Falkenmark)` : `${imp.water.stressLevel}水压力（Falkenmark）`}
        meta={imp.water.meta} />
      <ImpactCard title={en ? "Extreme heat" : "极端高温"} value={en ? `${imp.heat.heatwaveDays} days/yr` : `${imp.heat.heatwaveDays} 天/yr`}
        sub={imp.heat.deltaDays > 0 ? `+${imp.heat.deltaDays} vs 2024` : `${imp.heat.deltaDays} vs 2024`}
        meta={imp.heat.meta} />
      <ImpactCard title={en ? "Agricultural suitability" : "农业适宜度"} value={en ? (SUIT_EN[imp.agriculture.suitability] ?? imp.agriculture.suitability) : imp.agriculture.suitability}
        sub={en ? `GDD ${imp.agriculture.growingDegreeDays}°C·d · Water ${imp.agriculture.waterBalance}mm` : `GDD ${imp.agriculture.growingDegreeDays}°C·d · 水分 ${imp.agriculture.waterBalance}mm`}
        meta={imp.agriculture.meta} />
      <ImpactCard title={en ? "Ecological shift" : "生态迁移"} value={`${imp.ecology.biomeShift}%`}
        sub={en ? "Biome change (vs 2024)" : "群系改变（vs 2024）"}
        meta={imp.ecology.meta} />
      <ImpactCard title={en ? "Ocean acidification" : "海洋酸化"} value={`pH ${imp.oceanAcid.ph}`}
        sub={imp.oceanAcid.ph < 7.8 ? (en ? "Severe threat to coral reefs" : "珊瑚礁严重威胁") : (en ? "Changing" : "变化中")}
        meta={imp.oceanAcid.meta} />
      <ImpactCard title={en ? "Economic damage" : "经济损害"} value={`${imp.damage.gdpLossPct}%`}
        sub={en ? `Global GDP loss (${adaptation === "none" ? "no adaptation" : adaptation === "medium" ? "medium adaptation" : "high adaptation"})` : `全球 GDP 损失（${adaptation === "none" ? "无适应" : adaptation === "medium" ? "中等适应" : "高适应"}）`}
        meta={imp.damage.meta} />
      <ImpactCard title={en ? "Social cost of carbon" : "碳社会成本"} value={`$${imp.scc.scc}/tCO₂`}
        sub={en ? "Educational estimate (discount-rate sensitive)" : "教育性估计（折现率敏感）"}
        meta={imp.scc.meta} />
    </div>
  );
}
