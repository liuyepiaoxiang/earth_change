"use client";
/** V02 分析抽屉：时间序列 / 观测对照 / 海平面分量 / 为什么会这样 / 结果说明 */
import { useState } from "react";
import type { SimResultWithUnc } from "../lib/sim";
import { useI18n, type TranslationKey } from "../lib/i18n";
import TimeSeriesPanel from "./TimeSeriesPanel";
import ObsCompare from "./ObsCompare";
import SlrStacked from "./SlrStacked";
import ContributionPanel from "./ContributionPanel";
import MetadataPanel from "./MetadataPanel";
import ExperimentEditor from "./ExperimentEditor";
import ComparePanel from "./ComparePanel";
import SharePanel from "./SharePanel";
import RegionPanel from "./RegionPanel";
import ImpactPanel from "./ImpactPanel";
import MilestoneFeed from "./MilestoneFeed";
import MissionPanel from "./MissionPanel";
import GuessGame from "./GuessGame";
import CityRoulette from "./CityRoulette";
import type { ExperimentControls } from "@future-earth/engine";

// tab 状态直接用词典 key——UI 标签随 locale 切换，逻辑判断与语言解耦
const TABS = [
  "tab.timeseries", "tab.obsCompare", "tab.slrComponents", "tab.contribution", "tab.metadata",
  "tab.games", "tab.missions", "tab.milestones", "tab.compare", "tab.region", "tab.impact",
  "tab.lab", "tab.share",
] as const satisfies readonly TranslationKey[];
const btn = (on: boolean): React.CSSProperties => ({
  padding: "3px 10px", fontSize: 14, borderRadius: 6, cursor: "pointer",
  border: `1px solid ${on ? "#38bdf8" : "#334155"}`, background: on ? "#0c4a6e" : "transparent", color: on ? "#e0f2fe" : "#94a3b8",
});

export default function AnalysisDrawer(props: {
  sim: SimResultWithUnc; year: number; onClose: () => void;
  exp?: ExperimentControls;
  onExpChange?: (c: ExperimentControls) => void;
  onExitExp?: () => void;
  onJumpYear?: (y: number) => void;
  snap?: import("../lib/sim").MetricsSnapshot | null;
  pattern?: Array<{ latMin: number; latMax: number; amp: number }>;
  onSelectCity?: (c: import("@future-earth/data").CityRow) => void;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<(typeof TABS)[number]>("tab.timeseries");
  return (
    <aside data-testid="analysis-drawer" style={{
      position: "absolute", top: 0, right: 0, bottom: 0, width: "min(560px, 95vw)",
      background: "rgba(8, 15, 30, 0.96)", borderLeft: "1px solid #1e293b",
      padding: 12, overflowY: "auto", zIndex: 30,
    }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
        {TABS.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} style={btn(tab === k)} onClick={() => setTab(k)}>{t(k)}</button>
        ))}
        <button aria-label={t("drawer.close")} onClick={props.onClose}
          style={{ marginLeft: "auto", ...btn(false), borderColor: "#f87171", color: "#f87171" }}>✕</button>
      </div>
      {tab === "tab.timeseries" && <TimeSeriesPanel sim={props.sim} markerX={props.year} />}
      {tab === "tab.obsCompare" && <ObsCompare sim={props.sim} markerX={props.year} />}
      {tab === "tab.slrComponents" && <SlrStacked sim={props.sim} markerX={props.year} />}
      {tab === "tab.contribution" && <ContributionPanel sim={props.sim} year={props.year} />}
      {tab === "tab.metadata" && <MetadataPanel sim={props.sim} />}
      {tab === "tab.games" && (
        <div style={{ display: "grid", gap: 16 }}>
          <GuessGame sim={props.sim} currentYear={props.year} onJumpYear={props.onJumpYear ?? (() => {})} />
          {props.snap && props.pattern && props.onSelectCity && (
            <CityRoulette sim={props.sim} snap={props.snap} pattern={props.pattern} onSelectCity={props.onSelectCity} />
          )}
        </div>
      )}
      {tab === "tab.missions" && <MissionPanel sim={props.sim} />}
      {tab === "tab.milestones" && <MilestoneFeed sim={props.sim} year={props.year} onJump={props.onJumpYear ?? (() => {})} />}
      {tab === "tab.compare" && <ComparePanel a={props.sim} year={props.year} />}
      {tab === "tab.region" && <RegionPanel sim={props.sim} year={props.year} />}
      {tab === "tab.impact" && <ImpactPanel sim={props.sim} year={props.year} />}
      {tab === "tab.share" && <SharePanel sim={props.sim} year={props.year} exp={props.exp} />}
      {tab === "tab.lab" && props.exp && props.onExpChange && (
        <ExperimentEditor controls={props.exp} onChange={props.onExpChange} onExit={props.onExitExp ?? (() => {})} />
      )}
      {tab === "tab.lab" && !props.exp && (
        <p style={{ color: "#64748b", fontSize: 12 }}>{t("tab.labDisabled")}</p>
      )}
    </aside>
  );
}
