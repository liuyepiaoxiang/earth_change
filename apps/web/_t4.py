import io

# ===== 1) page.tsx → components/Dashboard.tsx（加 embed prop） =====
s = io.open("app/page.tsx", encoding="utf-8").read()
s = s.replace('export default function Home() {', 'export default function Dashboard({ embed = false }: { embed?: boolean }) {')
# embed 模式隐藏导航与工具按钮：nav 块 / ±区间 / 📊 / 🧪（分享在抽屉里，embed 下抽屉也不开）
s = s.replace('''        <nav style={{ display: "flex", gap: 6 }}>''',
'''        {!embed && <nav style={{ display: "flex", gap: 6 }}>''')
s = s.replace('''            要素总览
          </a>
        </nav>''',
'''            要素总览
          </a>
        </nav>}''')
s = s.replace('''        <button
          onClick={() => setUncertain((v) => !v)}''',
'''        {!embed && <button
          onClick={() => setUncertain((v) => !v)}''')
s = s.replace('''        >
          ±区间
        </button>''',
'''        >
          ±区间
        </button>}''')
s = s.replace('''        <button
          onClick={() => setShowAnalysis((v) => !v)}''',
'''        {!embed && <button
          onClick={() => setShowAnalysis((v) => !v)}''')
s = s.replace('''          📊 分析
        </button>''',
'''          📊 分析
        </button>}''')
s = s.replace('''        <button
          onClick={() => setExp((v) => (v ? undefined : { ...DEFAULT_CONTROLS }))}''',
'''        {!embed && <button
          onClick={() => setExp((v) => (v ? undefined : { ...DEFAULT_CONTROLS }))}''')
s = s.replace('''          🧪 实验
        </button>''',
'''          🧪 实验
        </button>}''')
# 相对导入路径调整（page 在 app/，Dashboard 在 components/）
s = s.replace('from "../lib/', 'from "../lib/').replace('from "../components/', 'from "./')
io.open("components/Dashboard.tsx", "w", encoding="utf-8", newline="\n").write(s)

io.open("app/page.tsx", "w", encoding="utf-8", newline="\n").write('''import Dashboard from "../components/Dashboard";

export default function Home() {
  return <Dashboard />;
}
''')

io.open("app/embed/page.tsx", "w", encoding="utf-8", newline="\n").write('''import type { Metadata } from "next";
import Dashboard from "../../components/Dashboard";

export const metadata: Metadata = { title: "未来地球引擎 · 嵌入视图" };

/** 嵌入模式：仅地球 + 时间轴 + 指标（无编辑器/导航） */
export default function Embed() {
  return <Dashboard embed />;
}
''')
print("dashboard extracted")

# ===== 2) 抽屉「分享」tab =====
f = "components/AnalysisDrawer.tsx"
s = io.open(f, encoding="utf-8").read()
s = s.replace('import ComparePanel from "./ComparePanel";',
'''import ComparePanel from "./ComparePanel";
import SharePanel from "./SharePanel";''')
s = s.replace('const TABS = ["时间序列", "观测对照", "海平面分量", "为什么会这样", "结果说明", "对比", "实验室"] as const;',
              'const TABS = ["时间序列", "观测对照", "海平面分量", "为什么会这样", "结果说明", "对比", "实验室", "分享"] as const;')
s = s.replace('''      {tab === "对比" && <ComparePanel a={props.sim} year={props.year} />}''',
'''      {tab === "对比" && <ComparePanel a={props.sim} year={props.year} />}
      {tab === "分享" && <SharePanel sim={props.sim} year={props.year} />}''')
io.open(f, "w", encoding="utf-8", newline="\n").write(s)

# ===== 3) SharePanel =====
io.open("components/SharePanel.tsx", "w", encoding="utf-8", newline="\n").write('''"use client";
/** V0.3 分享：复制可复现链接 / 导出 CSV / 导出 PNG 分享卡片 */
import { useMemo, useState } from "react";
import { serializeUrlState } from "../lib/url-state";
import { exportCsv, exportPngCard, copyShareUrl } from "../lib/export";
import { metricsAt } from "../lib/sim";
import type { SimResultWithUnc } from "../lib/sim";
import type { ExperimentControls } from "@future-earth/engine";

const btn: React.CSSProperties = {
  padding: "4px 10px", fontSize: 12, borderRadius: 6, cursor: "pointer",
  border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0",
};

export default function SharePanel(props: { sim: SimResultWithUnc; year: number; exp?: ExperimentControls }) {
  const { sim, year } = props;
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => serializeUrlState(
    { scenario: sim.scenario as "ssp126", year, exp: props.exp ?? sim.experiment?.controls },
    typeof window !== "undefined" ? window.location.origin + window.location.pathname : "/",
  ), [sim, year, props.exp]);

  return (
    <div data-testid="share-panel" style={{ fontSize: 12, color: "#94a3b8", display: "grid", gap: 10 }}>
      <div>
        <b style={{ color: "#e0f2fe" }}>可复现链接</b>
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <input readOnly value={url} aria-label="分享链接" style={{ flex: 1, background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 6, padding: 6, fontSize: 11 }} />
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
      <p style={{ color: "#475569" }}>链接包含情景、年份与实验配置（如启用）——任何人打开即得到逐位一致的结果（G9 可复现性）。</p>
    </div>
  );
}
''')
print("share panel done")
