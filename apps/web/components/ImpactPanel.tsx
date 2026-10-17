"use client";
/** V2.0 影响面板：8 影响指标 + 适应三档对比 + 公式/来源/越界警告（I-04/I-05 UI 侧） */
import { useMemo, useState } from "react";
import { runImpacts } from "@future-earth/engine";
import type { AdaptationLevel } from "@future-earth/engine";
import { loadCities } from "@future-earth/data";
import type { SimResultWithUnc } from "../lib/sim";

const LEVELS: Array<[AdaptationLevel, string]> = [["none", "无适应"], ["medium", "中等适应"], ["high", "高适应"]];
const seg = (on: boolean): React.CSSProperties => ({
  padding: "2px 8px", fontSize: 11, cursor: "pointer", border: `1px solid ${on ? "#38bdf8" : "#334155"}`,
  background: on ? "#0c4a6e" : "transparent", color: on ? "#e0f2fe" : "#94a3b8",
});
const card: React.CSSProperties = { border: "1px solid #1e293b", borderRadius: 8, padding: 10, marginBottom: 8, background: "#0f172a" };
const warn: React.CSSProperties = { color: "#f59e0b", fontSize: 11 };

function ImpactCard(props: { title: string; value: string; sub?: string; formula: string; source: string; range: string; warnings: string[] }) {
  return (
    <div style={card} data-testid={`impact-${props.title}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <b style={{ color: "#e0f2fe" }}>{props.title}</b>
        <span style={{ color: "#fbbf24", fontSize: 16, fontVariantNumeric: "tabular-nums" }}>{props.value}</span>
      </div>
      {props.sub && <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{props.sub}</div>}
      {props.warnings.map((w) => <div key={w} style={warn}>⚠ {w}</div>)}
      <details style={{ marginTop: 4, fontSize: 10, color: "#475569" }}>
        <summary>公式/来源/范围</summary>
        <div>{props.formula}</div><div>来源：{props.source}</div><div>适用：{props.range}</div>
      </details>
    </div>
  );
}

export default function ImpactPanel(props: { sim: SimResultWithUnc; year: number }) {
  const [adaptation, setAdaptation] = useState<AdaptationLevel>("none");
  const cities = useMemo(() => loadCities(), []);
  const imp = useMemo(() => runImpacts(props.sim, props.year, cities, adaptation), [props.sim, props.year, cities, adaptation]);
  const fmtPop = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : String(n);

  return (
    <div data-testid="impact-panel" style={{ fontSize: 12 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {LEVELS.map(([v, zh]) => <button key={v} style={seg(adaptation === v)} onClick={() => setAdaptation(v)}>{zh}</button>)}
      </div>
      <ImpactCard title="暴露人口" value={fmtPop(imp.exposure.exposedPopulation)}
        sub={`${imp.exposure.floodedCount} 城市被淹（含防护）`}
        formula={imp.exposure.meta.formula} source={imp.exposure.meta.source} range={imp.exposure.meta.validRange} warnings={imp.exposure.meta.warnings} />
      <ImpactCard title="人均水资源" value={`${imp.water.perCapitaM3} m³/yr`}
        sub={`${imp.water.stressLevel}水压力（Falkenmark）`}
        formula={imp.water.meta.formula} source={imp.water.meta.source} range={imp.water.meta.validRange} warnings={imp.water.meta.warnings} />
      <ImpactCard title="极端高温" value={`${imp.heat.heatwaveDays} 天/yr`}
        sub={imp.heat.deltaDays > 0 ? `+${imp.heat.deltaDays} vs 2024` : `${imp.heat.deltaDays} vs 2024`}
        formula={imp.heat.meta.formula} source={imp.heat.meta.source} range={imp.heat.meta.validRange} warnings={imp.heat.meta.warnings} />
      <ImpactCard title="农业适宜度" value={imp.agriculture.suitability}
        sub={`GDD ${imp.agriculture.growingDegreeDays}°C·d · 水分 ${imp.agriculture.waterBalance}mm`}
        formula={imp.agriculture.meta.formula} source={imp.agriculture.meta.source} range={imp.agriculture.meta.validRange} warnings={imp.agriculture.meta.warnings} />
      <ImpactCard title="生态迁移" value={`${imp.ecology.biomeShift}%`}
        sub={`群系改变（vs 2024）`}
        formula={imp.ecology.meta.formula} source={imp.ecology.meta.source} range={imp.ecology.meta.validRange} warnings={imp.ecology.meta.warnings} />
      <ImpactCard title="海洋酸化" value={`pH ${imp.oceanAcid.ph}`}
        sub={imp.oceanAcid.ph < 7.8 ? "珊瑚礁严重威胁" : "变化中"}
        formula={imp.oceanAcid.meta.formula} source={imp.oceanAcid.meta.source} range={imp.oceanAcid.meta.validRange} warnings={imp.oceanAcid.meta.warnings} />
      <ImpactCard title="经济损害" value={`${imp.damage.gdpLossPct}%`}
        sub={`全球 GDP 损失（${adaptation === "none" ? "无适应" : adaptation === "medium" ? "中等适应" : "高适应"}）`}
        formula={imp.damage.meta.formula} source={imp.damage.meta.source} range={imp.damage.meta.validRange} warnings={imp.damage.meta.warnings} />
      <ImpactCard title="碳社会成本" value={`$${imp.scc.scc}/tCO₂`}
        sub="教育性估计（折现率敏感）"
        formula={imp.scc.meta.formula} source={imp.scc.meta.source} range={imp.scc.meta.validRange} warnings={imp.scc.meta.warnings} />
    </div>
  );
}
