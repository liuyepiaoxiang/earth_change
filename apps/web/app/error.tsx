"use client";
/** 审计 SEC-03：路由级错误边界——渲染异常时给出可恢复 UI（重试/回首页），替代 Next 默认崩溃页 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 40, textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🌍</div>
        <h1 style={{ fontSize: 20, color: "#e0f2fe", margin: "0 0 8px" }}>页面出了点问题 / Something went wrong</h1>
        <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20 }}>
          模拟引擎未能完成渲染——请重试，或回到地球模拟器。
          <br />
          The simulation failed to render. Please retry, or go back to the globe.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{ padding: "10px 22px", borderRadius: 10, border: "1.5px solid #38bdf8", background: "#0c4a6e", color: "#e0f2fe", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
          >
            ↻ 重试 / Retry
          </button>
          <a
            href="/"
            style={{ padding: "10px 22px", borderRadius: 10, border: "1px solid #334155", color: "#94a3b8", textDecoration: "none", fontSize: 14 }}
          >
            🌍 首页 / Home
          </a>
        </div>
        {error.digest && <p style={{ color: "#475569", fontSize: 11, marginTop: 16 }}>Digest: {error.digest}</p>}
      </div>
    </main>
  );
}
