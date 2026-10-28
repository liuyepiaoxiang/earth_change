"use client";
/** V02 G0/UX：结果说明——模型层级、驱动段、置信标注、指纹、指标来源与单位 */
import { useI18n } from "../lib/i18n";
import type { SimResultWithUnc } from "../lib/sim";

const UNITS_ZH: Array<[string, string, string, string]> = [
  // 指标 / 单位 / 数据来源 / 模型层级
  ["全球 ΔT", "°C（相对工业化前）", "GISTEMP v4 校准", "全球箱 · 耦合"],
  ["大气 CO₂", "ppm", "NOAA GML + 冰芯", "历史排放驱动 / 情景浓度驱动"],
  ["海平面（四分量）", "m（自 1850 累计）", "AR6 量级锚定", "全球箱 · 耦合"],
  ["冻土碳 / 生物量", "GtC", "文献先验", "全球箱 · 耦合（v2）"],
  ["城市温度/淹没", "°C / m", "GeoNames + WorldClim", "模式缩放 · 诊断"],
];
const UNITS_EN: Array<[string, string, string, string]> = [
  ["Global ΔT", "°C (vs pre-industrial)", "GISTEMP v4 calibrated", "Global box · coupled"],
  ["Atmospheric CO₂", "ppm", "NOAA GML + ice cores", "Emissions-driven (historical) / concentration-driven (scenario)"],
  ["Sea level (4 components)", "m (cumulative since 1850)", "Anchored to AR6 magnitudes", "Global box · coupled"],
  ["Permafrost carbon / biomass", "GtC", "Literature priors", "Global box · coupled (v2)"],
  ["City temperature / flooding", "°C / m", "GeoNames + WorldClim", "Pattern scaling · diagnostic"],
];
/** engine confidenceNotes.label 中文 → 英文（固定枚举） */
const CONF_EN: Record<string, string> = {
  "历史复现段（GISTEMP/NOAA 校准）": "Historical reproduction (GISTEMP/NOAA calibrated)",
  "IPCC AR6 校准区间": "IPCC AR6 calibrated range",
  "探索性外推（低置信度）": "Exploratory extrapolation (low confidence)",
  "教育性实验（用户自定义排放路径），未经 AR6 区间锚定": "Educational experiment (custom emissions path), not anchored to AR6 ranges",
};

export default function MetadataPanel({ sim }: { sim: SimResultWithUnc }) {
  const { locale } = useI18n();
  const en = locale === "en";
  const UNITS = en ? UNITS_EN : UNITS_ZH;
  const md = sim.metadata;
  return (
    <div data-testid="metadata-panel" style={{ fontSize: 16, lineHeight: 1.7, color: "#94a3b8" }}>
      <p><b style={{ color: "#e0f2fe" }}>{en ? "Model scope" : "模型范围"}</b>{en ? ": Global aggregate box (global-box) — not a regional gridded result." : "：全球聚合箱（global-box）——非区域网格结果。"}</p>
      <p><b style={{ color: "#e0f2fe" }}>{en ? "Driving mode" : "驱动模式"}</b>{en ? ": " : "："}{md.driverSegments.map((s) => `${s.from}–${s.to ?? "2500"} ${s.mode === "emissions-driven" ? (en ? "emissions-driven" : "排放驱动") : (en ? "concentration-driven" : "浓度驱动")}`).join(en ? "; " : "；")}</p>
      <div><b style={{ color: "#e0f2fe" }}>{en ? "Confidence labels" : "置信标注"}</b>{en ? ":" : "："}
        <ul style={{ margin: "4px 0", paddingLeft: 18 }}>
          {md.confidenceNotes.map((n) => (
            <li key={n.from}>{n.from}–{n.to ?? "2500"}{en ? ": " : "："}{en ? (CONF_EN[n.label] ?? n.label) : n.label}</li>
          ))}
        </ul>
      </div>
      <p>{en ? "Model version" : "模型版本"} {sim.modelVersion} {en ? "· Params fingerprint" : "· 参数指纹"} <code>{sim.paramsFingerprint.slice(0, 23)}</code> {en ? "· Data fingerprint" : "· 数据指纹"} <code>{md.dataManifestHash}</code></p>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 15 }}>
        <thead><tr>{(en ? ["Indicator", "Unit", "Data source", "Model tier"] : ["指标", "单位", "数据来源", "模型层级"]).map((h) => (
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
