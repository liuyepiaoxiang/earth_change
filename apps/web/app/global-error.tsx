"use client";
/** 审计 SEC-03：根错误边界（layout 本身崩溃时的最后防线） */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, background: "#0b1120", color: "#e2e8f0", fontFamily: "system-ui, sans-serif", minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🌍</div>
          <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>应用遇到错误 / Application error</h1>
          <button
            onClick={reset}
            style={{ padding: "10px 22px", borderRadius: 10, border: "1.5px solid #38bdf8", background: "#0c4a6e", color: "#e0f2fe", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
          >
            ↻ 重试 / Retry
          </button>
        </div>
      </body>
    </html>
  );
}
