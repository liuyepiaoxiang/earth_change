"use client";
/** V02 G0/UX：结果说明——模型层级、驱动段、置信标注、指纹、指标来源与单位 */
import type { SimResultWithUnc } from "../lib/sim";

const UNITS: Array<[string, string, string, string]> = [
  // 指标 / 单位 / 数据来源 / 模型层级
  ["全球 ΔT", "°C（相对工业化前）", "GISTEMP v4 校准", "全球箱 · 耦合"],
  ["大气 CO₂", "ppm", "NOAA GML + 冰芯", "历史排放驱动 / 情景浓度驱动"],
  ["海平面（四分量）", "m（自 1850 累计）", "AR6 量级锚定", "全球箱 · 耦合"],
  ["冻土碳 / 生物量", "GtC", "文献先验", "全球箱 · 耦合（v2）"],
  ["城市温度/淹没", "°C / m", "GeoNames + WorldClim", "模式缩放 · 诊断"],
];

export default function MetadataPanel({ sim }: { sim: SimResultWithUnc }) {
  const md = sim.metadata;
  return (
    <div data-testid="metadata-panel" style={{ fontSize: 12, lineHeight: 1.7, color: "#94a3b8" }}>
      <p><b style={{ color: "#e0f2fe" }}>模型范围</b>：全球聚合箱（global-box）——非区域网格结果。</p>
      <p><b style={{ color: "#e0f2fe" }}>驱动模式</b>：{md.driverSegments.map((s) => `${s.from}–${s.to ?? "2500"} ${s.mode === "emissions-driven" ? "排放驱动" : "浓度驱动"}`).join("；")}</p>
      <div><b style={{ color: "#e0f2fe" }}>置信标注</b>：
        <ul style={{ margin: "4px 0", paddingLeft: 18 }}>
          {md.confidenceNotes.map((n) => (
            <li key={n.from}>{n.from}–{n.to ?? "2500"}：{n.label}</li>
          ))}
        </ul>
      </div>
      <p>模型版本 {sim.modelVersion} · 参数指纹 <code>{sim.paramsFingerprint.slice(0, 23)}</code> · 数据指纹 <code>{md.dataManifestHash}</code></p>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11 }}>
        <thead><tr>{["指标", "单位", "数据来源", "模型层级"].map((h) => (
          <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #334155", padding: "3px 6px", color: "#cbd5e1" }}>{h}</th>
        ))}</tr></thead>
        <tbody>
          {UNITS.map((r) => (
            <tr key={r[0]}>{r.map((c, i) => <td key={i} style={{ padding: "3px 6px", borderBottom: "1px solid #1e293b" }}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
