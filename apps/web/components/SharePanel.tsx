"use client";
/** V0.3 分享：复制可复现链接 / 导出 CSV / 导出 PNG 分享卡片 */
import { useMemo, useState } from "react";
import type { ScenarioId } from "@future-earth/engine";
import { serializeUrlState } from "../lib/url-state";
import { exportCsv, exportPngCard, copyShareUrl } from "../lib/export";
import { generateShareText, xShareUrl } from "../lib/share-text";
import { metricsAt } from "../lib/sim";
import type { SimResultWithUnc } from "../lib/sim";
import type { ExperimentControls } from "@future-earth/engine";

const btn: React.CSSProperties = {
  padding: "4px 10px", fontSize: 16, borderRadius: 6, cursor: "pointer",
  border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0",
};

export default function SharePanel(props: { sim: SimResultWithUnc; year: number; exp?: ExperimentControls }) {
  const { sim, year } = props;
  const [copied, setCopied] = useState(false);
  const shareText = useMemo(() => generateShareText({ sim, year }), [sim, year]);
  const url = useMemo(() => serializeUrlState(
    { scenario: sim.scenario as ScenarioId, year, exp: props.exp ?? sim.experiment?.controls },
    typeof window !== "undefined" ? window.location.origin + window.location.pathname : "/",
  ), [sim, year, props.exp]);

  return (
    <div data-testid="share-panel" style={{ fontSize: 16, color: "#94a3b8", display: "grid", gap: 10 }}>
      <div>
        <b style={{ color: "#e0f2fe" }}>可复现链接</b>
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <input readOnly value={url} aria-label="分享链接" style={{ flex: 1, background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 6, padding: 6, fontSize: 15 }} />
          <button style={btn} onClick={async () => setCopied(await copyShareUrl(url))}>{copied ? "✅ 已复制" : "复制"}</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button style={btn} onClick={() => exportCsv(sim)}>⬇ 导出 CSV（年度序列）</button>
        <button style={btn} onClick={() => {
          const snapAt = (y: number) => metricsAt(sim, y);
          exportPngCard(sim, year,
            (y) => snapAt(y)?.seaLevel.total ?? 0,
            (y) => snapAt(y)?.tempAnomaly ?? 0);
        }}>🖼 导出 PNG 分享卡片</button>
      </div>
      <div>
        <b style={{ color: "#e0f2fe" }}>社交分享</b>
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <a href={xShareUrl(shareText)} target="_blank" rel="noopener noreferrer" style={{ ...btn, textDecoration: "none", borderColor: "#38bdf8" }}>𝕏 分享到 X</a>
          <button style={btn} onClick={async () => setCopied(await copyShareUrl(shareText))}>{copied ? "✅ 已复制" : "复制文案"}</button>
        </div>
        <textarea readOnly value={shareText} rows={3} aria-label="分享文案" style={{ width: "100%", marginTop: 6, background: "#0f172a", color: "#94a3b8", border: "1px solid #334155", borderRadius: 6, padding: 6, fontSize: 15, resize: "none" }} />
      </div>
      <p style={{ color: "#475569" }}>链接包含情景、年份与实验配置（如启用）——任何人打开即得到逐位一致的结果（G9 可复现性）。</p>
    </div>
  );
}
