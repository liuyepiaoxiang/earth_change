/** SEO 教育页面共享样式（非 client 组件，纯常量导出） */
export const learnStyle = {
  h2: { fontSize: 20, color: "#7dd3fc", marginTop: 32, marginBottom: 12 } as React.CSSProperties,
  h3: { fontSize: 16, color: "#e0f2fe", marginTop: 24, marginBottom: 8 } as React.CSSProperties,
  p: { fontSize: 15, color: "#cbd5e1", lineHeight: 1.8, marginBottom: 16 } as React.CSSProperties,
  ul: { fontSize: 15, color: "#cbd5e1", lineHeight: 1.8, marginBottom: 16, paddingLeft: 24 } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const, margin: "16px 0", fontSize: 13 } as React.CSSProperties,
  th: { padding: "8px 12px", textAlign: "left" as const, borderBottom: "2px solid #334155", color: "#7dd3fc", background: "#0f172a" } as React.CSSProperties,
  td: { padding: "8px 12px", borderBottom: "1px solid #1e293b", color: "#cbd5e1" } as React.CSSProperties,
  cta: { display: "block", margin: "32px auto", padding: "14px 32px", textAlign: "center" as const, background: "#0c4a6e", color: "#e0f2fe", borderRadius: 12, textDecoration: "none", fontSize: 16, fontWeight: "bold", border: "1px solid #38bdf8" } as React.CSSProperties,
  warning: { padding: "12px 16px", background: "#78350f", borderRadius: 8, color: "#fef3c7", fontSize: 13, margin: "16px 0" } as React.CSSProperties,
  source: { fontSize: 12, color: "#64748b", marginTop: 4 } as React.CSSProperties,
};
