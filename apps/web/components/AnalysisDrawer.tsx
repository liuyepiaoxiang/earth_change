"use client";
/** V02 分析抽屉：时间序列 / 观测对照 / 海平面分量 / 为什么会这样 / 结果说明 */
import { useState } from "react";
import type { SimResultWithUnc } from "../lib/sim";
import TimeSeriesPanel from "./TimeSeriesPanel";
import ObsCompare from "./ObsCompare";
import SlrStacked from "./SlrStacked";
import ContributionPanel from "./ContributionPanel";
import MetadataPanel from "./MetadataPanel";
import ExperimentEditor from "./ExperimentEditor";
import ComparePanel from "./ComparePanel";
import SharePanel from "./SharePanel";
import RegionPanel from "./RegionPanel";
import type { ExperimentControls } from "@future-earth/engine";

const TABS = ["时间序列", "观测对照", "海平面分量", "为什么会这样", "结果说明", "对比", "区域", "实验室", "分享"] as const;
const btn = (on: boolean): React.CSSProperties => ({
  padding: "3px 10px", fontSize: 12, borderRadius: 6, cursor: "pointer",
  border: `1px solid ${on ? "#38bdf8" : "#334155"}`, background: on ? "#0c4a6e" : "transparent", color: on ? "#e0f2fe" : "#94a3b8",
});

export default function AnalysisDrawer(props: {
  sim: SimResultWithUnc; year: number; onClose: () => void;
  exp?: ExperimentControls;
  onExpChange?: (c: ExperimentControls) => void;
  onExitExp?: () => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("时间序列");
  return (
    <aside data-testid="analysis-drawer" style={{
      position: "absolute", top: 0, right: 0, bottom: 0, width: "min(420px, 92vw)",
      background: "rgba(8, 15, 30, 0.96)", borderLeft: "1px solid #1e293b",
      padding: 12, overflowY: "auto", zIndex: 30,
    }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} style={btn(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
        <button aria-label="关闭分析面板" onClick={props.onClose}
          style={{ marginLeft: "auto", ...btn(false), borderColor: "#f87171", color: "#f87171" }}>✕</button>
      </div>
      {tab === "时间序列" && <TimeSeriesPanel sim={props.sim} markerX={props.year} />}
      {tab === "观测对照" && <ObsCompare sim={props.sim} markerX={props.year} />}
      {tab === "海平面分量" && <SlrStacked sim={props.sim} markerX={props.year} />}
      {tab === "为什么会这样" && <ContributionPanel sim={props.sim} year={props.year} />}
      {tab === "结果说明" && <MetadataPanel sim={props.sim} />}
      {tab === "对比" && <ComparePanel a={props.sim} year={props.year} />}
      {tab === "区域" && <RegionPanel sim={props.sim} year={props.year} />}
      {tab === "分享" && <SharePanel sim={props.sim} year={props.year} exp={props.exp} />}
      {tab === "实验室" && props.exp && props.onExpChange && (
        <ExperimentEditor controls={props.exp} onChange={props.onExpChange} onExit={props.onExitExp ?? (() => {})} />
      )}
      {tab === "实验室" && !props.exp && (
        <p style={{ color: "#64748b", fontSize: 12 }}>实验未启用——点击顶部「🧪 实验」开始自定义排放路径。</p>
      )}
    </aside>
  );
}
