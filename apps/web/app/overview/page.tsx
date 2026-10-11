import { loadOverviewData } from "@future-earth/spec/overview-data";
import OverviewContent from "./OverviewContent";
import { tokens } from "../../lib/design";

// 要素总览 tab（F17）：SSR 时从规格 YAML 加载数据（Node 侧），客户端零规格加载
export default function OverviewPage() {
  const data = loadOverviewData();
  return (
    <main style={{ height: "100vh", display: "grid", gridTemplateRows: "auto 1fr", background: tokens.bg }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "8px 16px",
          borderBottom: `1px solid ${tokens.panelBorder}`,
        }}
      >
        <strong style={{ color: tokens.textStrong }}>🌍 未来地球引擎</strong>
        <nav style={{ display: "flex", gap: 6 }}>
          <a
            href="/"
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 13,
              border: `1px solid ${tokens.panelBorderActive}`,
              color: tokens.textMuted,
              textDecoration: "none",
            }}
          >
            地球
          </a>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 13,
              border: "1px solid #38bdf8",
              background: "#0c4a6e",
              color: "#e0f2fe",
            }}
          >
            要素总览
          </span>
        </nav>
      </header>
      <section style={{ minHeight: 0, overflow: "auto" }}>
        <OverviewContent data={data} />
      </section>
    </main>
  );
}
