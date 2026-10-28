"use client";
/** V02「为什么会这样」：当前年强迫分解 + 海平面分量占比（来自引擎 diagnostics） */
import { useI18n } from "../lib/i18n";
import type { SimResultWithUnc } from "../lib/sim";

export default function ContributionPanel({ sim, year }: { sim: SimResultWithUnc; year: number }) {
  const { locale } = useI18n();
  const en = locale === "en";
  const dg = sim.metrics.diagnostics;
  if (!dg) return <div style={{ color: "#64748b", fontSize: 16 }}>{en ? "Diagnostic breakdown not available in the current engine version (requires v0.2+)." : "当前引擎版本未提供诊断分解（需 v0.2+）。"}</div>;
  const i = sim.years.indexOf(year);
  const idx = i >= 0 ? i : sim.years.length - 1;
  const y = sim.years[idx]!;
  const f: Array<[string, number]> = [
    ["CO₂", dg.forcing.co2[idx]!], ["CH₄", dg.forcing.ch4[idx]!],
    ["N₂O", dg.forcing.n2o[idx]!], [en ? "Other" : "其他", dg.forcing.other[idx]!],
  ];
  const fMax = Math.max(...f.map(([, v]) => Math.abs(v)), 0.1);
  const sl = sim.metrics.seaLevel;
  const total = Math.max(sl.total[idx]!, 1e-9);
  const comps: Array<[string, number]> = [
    [en ? "Thermal expansion" : "热膨胀", sl.thermal[idx]!], [en ? "Glaciers" : "冰川", sl.glacier[idx]!],
    [en ? "Ice sheets" : "冰盖", sl.iceSheet[idx]!], [en ? "Land water" : "陆地水", sl.landWater[idx]!],
  ];
  return (
    <div data-testid="contribution-panel" style={{ fontSize: 16, color: "#94a3b8" }}>
      <b style={{ color: "#e0f2fe" }}>{en ? `Radiative forcing breakdown in ${y}` : `${y} 年辐射强迫分解`}</b>{en ? " (total " : "（总 "}{dg.forcing.total[idx]!.toFixed(2)} W/m²{en ? ")" : "）"}
      {f.map(([k, v]) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, margin: "3px 0" }}>
          <span style={{ width: 34 }}>{k}</span>
          <div style={{ flex: 1, background: "#0f172a", borderRadius: 4, height: 10, position: "relative" }}>
            <div style={{
              position: "absolute", top: 0, bottom: 0,
              width: `${(Math.abs(v) / fMax) * 50}%`,
              ...(v >= 0 ? { left: "50%" } : { right: "50%" }),
              background: v >= 0 ? "#f87171" : "#60a5fa", borderRadius: 4,
            }} />
          </div>
          <span style={{ width: 64, textAlign: "right" }}>{v.toFixed(2)} W/m²</span>
        </div>
      ))}
      <b style={{ color: "#e0f2fe", display: "block", marginTop: 10 }}>{en ? `Sea-level contributions in ${y}` : `${y} 年海平面贡献占比`}</b>{en ? " (cumulative " : "（累计 "}{(total).toFixed(2)} m{en ? ")" : "）"}
      <div style={{ display: "flex", height: 14, borderRadius: 4, overflow: "hidden", marginTop: 4 }}>
        {comps.map(([k, v], j) => (
          <div key={k} title={en ? `${k} ${v.toFixed(2)} m (${((v / total) * 100).toFixed(0)}%)` : `${k} ${v.toFixed(2)} m（${((v / total) * 100).toFixed(0)}%）`}
            style={{ width: `${(v / total) * 100}%`, background: ["#38bdf8", "#67e8f9", "#a5b4fc", "#94a3b8"][j] }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
        {comps.map(([k, v], j) => (
          <span key={k} style={{ color: ["#38bdf8", "#67e8f9", "#a5b4fc", "#94a3b8"][j] }}>{k} {((v / total) * 100).toFixed(0)}%</span>
        ))}
      </div>
      <p style={{ marginTop: 10 }}>{en ? "Ocean heat uptake" : "海洋热吸收"} {dg.oceanHeatUptake[idx]!.toFixed(2)} W/m² {en ? "· Sea-ice area" : "· 海冰面积"} {dg.seaIceArea[idx]!.toFixed(1)}×10⁶ km² {en ? "· Fire flux anomaly" : "· 火灾异常通量"} {dg.bio.fireAnomaly[idx]!.toFixed(2)} GtC/yr</p>
    </div>
  );
}
