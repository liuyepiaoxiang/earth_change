import type { OverviewData } from "@future-earth/spec/overview-data";
import { tokens } from "../../lib/design";

const IMPL_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  v0: { label: "已实现", bg: "#14532d", fg: "#bbf7d0" },
  v1: { label: "诊断式已实现", bg: "#1e3a8a", fg: "#bfdbfe" },
  v2: { label: "规划", bg: "#713f12", fg: "#fde68a" },
  v3: { label: "规划", bg: "#3f3f46", fg: "#d4d4d8" },
};

function Badge({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span style={{ background: bg, color: fg, borderRadius: 4, padding: "0 6px", fontSize: 11, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: "4px 10px", borderBottom: `1px solid ${tokens.panelBorder}`, color: tokens.textFaint, fontWeight: 500 }}>{children}</th>;
}
function Td({ children, mono, dim, formula }: { children: React.ReactNode; mono?: boolean; dim?: boolean; formula?: boolean }) {
  return (
    <td style={{ textAlign: "left", padding: "4px 10px", borderBottom: `1px solid ${tokens.panelBorder}`, verticalAlign: "top", fontFamily: mono ? "ui-monospace, monospace" : undefined, fontSize: mono ? 12.5 : undefined, color: dim ? tokens.textFaint : formula ? "#a5f3fc" : undefined }}>
      {children}
    </td>
  );
}

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <div style={{ border: `1px solid ${tokens.panelBorder}`, borderRadius: 8, padding: "10px 14px", background: "#0b1220" }}>
      <b style={{ fontSize: 24, color: "#7dd3fc", display: "block" }}>{n}</b>
      <span style={{ color: tokens.textFaint, fontSize: 12 }}>{label}</span>
    </div>
  );
}

export default function OverviewContent({ data }: { data: OverviewData }) {
  const stateVars = data.variables.filter((v) => v.state).length;
  const byDomain: Record<string, typeof data.variables> = {};
  for (const v of data.variables) (byDomain[v.domain] = byDomain[v.domain] || []).push(v);
  const domName = Object.fromEntries(data.domains.map((d) => [d.id, `${d.name_zh} ${d.name_en}`]));

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto", overflow: "auto", height: "100%" }}>
      <h1 style={{ color: tokens.textStrong, fontSize: 22, margin: "0 0 8px" }}>实体与公式总览</h1>
      <p style={{ color: tokens.textFaint, fontSize: 13, margin: "0 0 16px" }}>
        由规格 YAML（唯一事实源）构建时生成——与模拟运行同一份规格，天然无漂移
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, margin: "16px 0" }}>
        <Stat n={data.domains.length} label="本体域" />
        <Stat n={data.variables.length} label="实体（变量）" />
        <Stat n={stateVars} label="状态量" />
        <Stat n={data.variables.length - stateVars} label="诊断量" />
        <Stat n={data.equations.length} label="方程" />
        <Stat n={data.parameters.length} label="参数" />
        <Stat n={data.scenarios.length} label="排放情景" />
        <Stat n={data.causalEdges} label="因果边" />
        <Stat n={data.loops.length} label="反馈回路" />
        <Stat n={data.datasets.length} label="数据集" />
      </div>

      <div style={{ ...{ background: "#0b1220", borderLeft: "3px solid #38bdf8", padding: "8px 14px", borderRadius: 4, color: tokens.textMuted, fontSize: 13, marginBottom: 24 } }}>
        53 条方程全部实现并注册；solver 积分状态量中的核心子集（CO₂ / 温度两层 / 海平面四项 + v2 四箱
        B/W/Mpf/PTh），其余为诊断派生。实现批次标记 v0 = 已实现。
      </div>

      <h2 style={{ color: "#7dd3fc", borderBottom: `1px solid ${tokens.panelBorder}`, paddingBottom: 6 }}>一、本体域（{data.domains.length}）</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
        <tr><Th>域</Th><Th>名称</Th><Th>子域</Th></tr>
        {data.domains.map((d) => (
          <tr key={d.id}>
            <Td mono>{d.id}</Td>
            <Td>{d.name_zh} {d.name_en}</Td>
            <Td mono dim>{d.children?.join(", ")}</Td>
          </tr>
        ))}
      </table>

      <h2 style={{ color: "#7dd3fc", borderBottom: `1px solid ${tokens.panelBorder}`, paddingBottom: 6 }}>
        二、实体（变量）{data.variables.length} —— 按域分组
      </h2>
      {Object.entries(byDomain).map(([dom, list]) => (
        <div key={dom}>
          <h3 style={{ color: tokens.textMuted, marginTop: 20 }}>
            {dom} <span style={{ color: tokens.textFaint, fontWeight: 400 }}>{domName[dom] ?? ""}</span>{" "}
            <span style={{ background: "#1e293b", borderRadius: 10, padding: "0 8px", fontSize: 12, color: "#7dd3fc" }}>{list.length}</span>
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
            <tr><Th>id</Th><Th>名称</Th><Th>单位</Th><Th>类型</Th><Th>批次</Th><Th>关联方程</Th></tr>
            {list.map((v) => (
              <tr key={v.id}>
                <Td mono>{v.id}</Td>
                <Td>{v.name_zh}</Td>
                <Td mono>{v.unit || "—"}</Td>
                <Td>{v.state ? <Badge label="状态量" bg="#4c1d95" fg="#ddd6fe" /> : <Badge label="诊断量" bg="#334155" fg="#cbd5e1" />}</Td>
                <Td>{(() => { const b = IMPL_BADGE[v.impl]; return b ? <Badge label={b.label} bg={b.bg} fg={b.fg} /> : v.impl; })()}</Td>
                <Td mono dim>{v.equations?.join(" ")}</Td>
              </tr>
            ))}
          </table>
        </div>
      ))}

      <h2 style={{ color: "#7dd3fc", borderBottom: `1px solid ${tokens.panelBorder}`, paddingBottom: 6 }}>
        三、方程 {data.equations.length}（全部已实现）
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
        <tr><Th>id</Th><Th>名称</Th><Th>公式</Th><Th>批次</Th></tr>
        {data.equations.map((e) => (
          <tr key={e.id}>
            <Td mono>{e.id}</Td>
            <Td>{e.name_zh}</Td>
            <Td mono formula>{e.formula}</Td>
            <Td>{(() => { const b = IMPL_BADGE[e.impl]; return b ? <Badge label={b.label} bg={b.bg} fg={b.fg} /> : e.impl; })()}</Td>
          </tr>
        ))}
      </table>

      <h2 style={{ color: "#7dd3fc", borderBottom: `1px solid ${tokens.panelBorder}`, paddingBottom: 6 }}>
        四、参数 {data.parameters.length}
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
        <tr><Th>id</Th><Th>名称</Th><Th>默认值</Th><Th>先验范围</Th><Th>单位</Th></tr>
        {data.parameters.map((p) => (
          <tr key={p.id}>
            <Td mono>{p.id}</Td>
            <Td>{p.name_zh}</Td>
            <Td mono>{p.default}</Td>
            <Td mono dim>[{p.min}, {p.max}]</Td>
            <Td mono>{p.unit || "—"}</Td>
          </tr>
        ))}
      </table>

      <h2 style={{ color: "#7dd3fc", borderBottom: `1px solid ${tokens.panelBorder}`, paddingBottom: 6 }}>
        五、因果图 {data.causalEdges} 边 · {data.loops.length} 反馈回路
      </h2>
      <p style={{ marginBottom: 24 }}>
        {data.loops.map((l) => (
          <span key={l.id} style={{ background: "#334155", color: "#cbd5e1", borderRadius: 4, padding: "0 6px", fontSize: 11, marginRight: 8 }}>
            {l.id} ×{l.count}
          </span>
        ))}
      </p>

      <h2 style={{ color: "#7dd3fc", borderBottom: `1px solid ${tokens.panelBorder}`, paddingBottom: 6 }}>
        六、数据集 {data.datasets.length}
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
        <tr><Th>id</Th><Th>名称</Th></tr>
        {data.datasets.map((d, i) => (
          <tr key={d.id ?? i}>
            <Td mono>{d.id ?? ""}</Td>
            <Td>{d.name ?? ""}</Td>
          </tr>
        ))}
      </table>

      <p style={{ color: tokens.textDisabled, fontSize: 12 }}>
        完整边表与数据源详情见 packages/spec/src/spec/*.yaml 与 docs/实体与公式总览.html
      </p>
    </div>
  );
}
