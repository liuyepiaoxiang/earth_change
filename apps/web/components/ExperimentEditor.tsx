"use client";
/** V0.3 情景实验室：7 控制项 + 本地保存（最多 5 个） + 恢复默认 */
import { useEffect, useState } from "react";
import type { ExperimentControls } from "@future-earth/engine";
import { DEFAULT_CONTROLS } from "@future-earth/engine";

const STORE_KEY = "fe-lab-experiments-v1";
export interface SavedExperiment { name: string; note: string; controls: ExperimentControls; savedAt: string }

const TIERS = [
  { key: "methanePath", label: "甲烷路径", opts: [["low", "低"], ["medium", "中"], ["high", "高"]] },
  { key: "lulucPath", label: "土地利用排放", opts: [["low", "低"], ["medium", "基准"], ["high", "高"]] },
  { key: "sinkCapacity", label: "碳汇能力", opts: [["conservative", "保守"], ["baseline", "基准"], ["enhanced", "增强"]] },
] as const;
const DEFENSE = [["none", "不防护"], ["fixed", "固定高程（>100 万人口 +2m）"], ["adaptive", "适应（>500 万 +3m / 其余 +1.5m）"]] as const;

const seg = (on: boolean): React.CSSProperties => ({
  padding: "2px 8px", fontSize: 11, cursor: "pointer", border: `1px solid ${on ? "#38bdf8" : "#334155"}`,
  background: on ? "#0c4a6e" : "transparent", color: on ? "#e0f2fe" : "#94a3b8",
});

export default function ExperimentEditor(props: {
  controls: ExperimentControls;
  onChange: (c: ExperimentControls) => void;
  onExit: () => void;
}) {
  const { controls: c, onChange } = props;
  const [saved, setSaved] = useState<SavedExperiment[]>([]);
  const [name, setName] = useState("我的实验");
  const [note, setNote] = useState("");
  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]")); } catch { /* 忽略损坏 */ }
  }, []);

  const save = () => {
    const next = [...saved, { name, note, controls: c, savedAt: new Date().toISOString() }];
    while (next.length > 5) next.shift(); // 环形覆盖：最多 5 个
    setSaved(next);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  };
  const del = (i: number) => {
    const next = saved.filter((_, j) => j !== i);
    setSaved(next);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  };

  return (
    <div data-testid="experiment-editor" style={{ fontSize: 12, color: "#94a3b8" }}>
      <p style={{ color: "#fbbf24" }}>⚠ 教育性实验：排放驱动自由运行，未经 AR6 区间锚定。</p>
      <label style={{ display: "block", margin: "8px 0" }}>
        排放强度 ×{c.emissionScale.toFixed(2)}
        <input type="range" min={0.5} max={1.5} step={0.05} value={c.emissionScale} aria-label="排放强度"
          onChange={(e) => onChange({ ...c, emissionScale: Number(e.target.value) })} style={{ width: "100%" }} />
      </label>
      <label style={{ display: "block", margin: "8px 0" }}>
        减排起始年 {c.declineStart}
        <input type="range" min={2025} max={2100} step={5} value={c.declineStart} aria-label="减排起始年"
          onChange={(e) => onChange({ ...c, declineStart: Math.min(Number(e.target.value), c.netZeroYear - 5) })} style={{ width: "100%" }} />
      </label>
      <label style={{ display: "block", margin: "8px 0" }}>
        净零年份 {c.netZeroYear}
        <input type="range" min={2030} max={2200} step={5} value={c.netZeroYear} aria-label="净零年份"
          onChange={(e) => onChange({ ...c, netZeroYear: Math.max(Number(e.target.value), c.declineStart + 5) })} style={{ width: "100%" }} />
      </label>
      {TIERS.map((t) => (
        <div key={t.key} style={{ margin: "8px 0" }}>
          {t.label}
          <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
            {t.opts.map(([v, zh]) => (
              <button key={v} style={seg(c[t.key] === v)} aria-pressed={c[t.key] === v}
                onClick={() => onChange({ ...c, [t.key]: v } as ExperimentControls)}>{zh}</button>
            ))}
          </div>
        </div>
      ))}
      <label style={{ display: "block", margin: "8px 0" }}>
        海岸防护
        <select value={c.coastalDefense} aria-label="海岸防护" onChange={(e) => onChange({ ...c, coastalDefense: e.target.value as ExperimentControls["coastalDefense"] })}
          style={{ width: "100%", background: "#0f172a", color: "#cbd5e1", border: "1px solid #334155", borderRadius: 6, padding: 4 }}>
          {DEFENSE.map(([v, zh]) => <option key={v} value={v}>{zh}</option>)}
        </select>
      </label>
      <div style={{ display: "flex", gap: 6, margin: "10px 0" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="实验名称" placeholder="实验名称"
          style={{ flex: 1, background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 6, padding: 4 }} />
        <button onClick={save} style={seg(false)}>💾 保存</button>
        <button onClick={() => onChange({ ...DEFAULT_CONTROLS })} style={seg(false)}>↺ 默认</button>
        <button onClick={props.onExit} style={{ ...seg(false), borderColor: "#f87171", color: "#f87171" }}>退出实验</button>
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} aria-label="备注" placeholder="备注（可选）"
        style={{ width: "100%", background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 6, padding: 4, marginBottom: 8 }} />
      {saved.length > 0 && <b style={{ color: "#cbd5e1" }}>已保存实验（{saved.length}/5）</b>}
      {saved.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", margin: "4px 0" }}>
          <button style={seg(false)} onClick={() => { onChange(s.controls); setName(s.name); setNote(s.note); }}>载入</button>
          <span style={{ flex: 1 }}>{s.name} <span style={{ color: "#475569" }}>{s.savedAt.slice(0, 10)}</span></span>
          <button style={{ ...seg(false), borderColor: "#f87171", color: "#f87171" }} onClick={() => del(i)}>删</button>
        </div>
      ))}
    </div>
  );
}
