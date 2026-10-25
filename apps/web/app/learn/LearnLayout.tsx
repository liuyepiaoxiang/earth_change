import Link from "next/link";

export default function LearnLayout(props: { title: string; children: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", background: "#05070f", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ padding: "12px 20px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={{ color: "#38bdf8", textDecoration: "none", fontSize: 14 }}>🌍 未来地球引擎</Link>
        <span style={{ color: "#475569" }}>|</span>
        <Link href="/overview" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13 }}>导览</Link>
        <span style={{ color: "#64748b", fontSize: 12, marginLeft: "auto" }}>教育内容</span>
      </header>
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{ fontSize: 28, color: "#e0f2fe", marginBottom: 8, lineHeight: 1.3 }}>{props.title}</h1>
        {props.children}
      </article>
    </main>
  );
}
