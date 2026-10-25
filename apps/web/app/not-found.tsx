import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", background: "#05070f", color: "#e2e8f0", fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 480, padding: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🌍</div>
        <h1 style={{ fontSize: 28, color: "#e0f2fe", marginBottom: 8 }}>404 — 页面未找到</h1>
        <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
          这个页面可能已被移动或从未存在。
          你可以回到地球模拟器，或者浏览我们的气候教育内容。
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ padding: "12px 24px", background: "#0c4a6e", color: "#e0f2fe", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: "bold", border: "1px solid #38bdf8" }}>
            🌍 地球模拟器
          </Link>
          <Link href="/learn/ssp-scenarios" style={{ padding: "12px 24px", background: "#0f172a", color: "#94a3b8", borderRadius: 10, textDecoration: "none", fontSize: 14, border: "1px solid #334155" }}>
            📚 SSP 情景解释
          </Link>
          <Link href="/learn/sea-level-rise" style={{ padding: "12px 24px", background: "#0f172a", color: "#94a3b8", borderRadius: 10, textDecoration: "none", fontSize: 14, border: "1px solid #334155" }}>
            🌊 海平面上升
          </Link>
          <Link href="/learn/cities-underwater" style={{ padding: "12px 24px", background: "#0f172a", color: "#94a3b8", borderRadius: 10, textDecoration: "none", fontSize: 14, border: "1px solid #334155" }}>
            🏙️ 城市淹没
          </Link>
        </div>
      </div>
    </main>
  );
}
