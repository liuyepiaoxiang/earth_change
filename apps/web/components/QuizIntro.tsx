"use client";
/** A1 进站猜猜看弹层：首访 + sim 就绪后弹出「2100 年全球升温多少？」（猜 ΔT 反转玩法）。
 *  仓库第一块正规 dialog：role="dialog" aria-modal + Escape 关闭 + 初始 focus 滑杆；
 *  localStorage fe-quiz-intro-v1 标记首访（照抄 fe-locale 模式），embed 模式跳过。 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { SimResultWithUnc } from "../lib/sim";
import { useI18n } from "../lib/i18n";
import { tempQuestion, gradeDiff, MEDALS, DIFFS } from "../lib/guess-core";
import { track } from "@vercel/analytics";
import { panelStyle, tokens } from "../lib/design";

const LS_KEY = "fe-quiz-intro-v1";

function hasSeenIntro(): boolean {
  try { return localStorage.getItem(LS_KEY) === "1"; } catch { return false; }
}
function markSeen() {
  try { localStorage.setItem(LS_KEY, "1"); } catch { /* 隐私模式等场景静默 */ }
}

export default function QuizIntro({
  sim,
  year,
  onClose,
  onMore,
}: {
  sim: SimResultWithUnc | null;
  year: number;
  onClose: () => void;
  onMore: () => void; // 「再来一题」→ 打开分析抽屉趣玩 tab
}) {
  const { t, locale } = useI18n();
  // 词典句式带 {var} 占位符，本地替换（t() 无插值支持）
  const fmt = (key: Parameters<typeof t>[0], vars: Record<string, string>) =>
    t(key).replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
  const [visible, setVisible] = useState(false);
  const [guess, setGuess] = useState(1.5);
  const [revealed, setRevealed] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);

  // 首访 + sim 就绪 → 显示（SSR/测试环境 localStorage 不可用时 window 检查兜底）
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasSeenIntro() || !sim) return;
    setVisible(true);
  }, [sim]);

  const close = () => { markSeen(); setVisible(false); onClose(); };
  useEffect(() => {
    if (!visible) return;
    sliderRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const q = useMemo(() => (sim ? tempQuestion(sim, 2100) : null), [sim]);
  if (!visible || !q) return null;

  const diff = Math.abs(guess - q.actualDT);
  const idx = gradeDiff(diff);
  const under = guess < q.actualDT;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(2,6,17,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("quiz.title")}
        className="fe-fade-up"
        style={{ width: 420, maxWidth: "100%", padding: "22px 24px", ...panelStyle, border: `1px solid ${tokens.panelBorderActive}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 11, color: tokens.textFaint, marginBottom: 6 }}>🌍 {t("quiz.brand")}</div>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, color: tokens.textStrong }}>{t("quiz.title")}</h2>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: tokens.textMuted }}>
          {fmt("quiz.subtitle", { year: "2100", scen: (sim?.scenario ?? "ssp245").toUpperCase() })}
        </p>

        {!revealed ? (
          <>
            <div style={{ textAlign: "center", margin: "10px 0 2px" }}>
              <span style={{ fontSize: 40, fontWeight: 700, color: tokens.accent, fontVariantNumeric: "tabular-nums" }}>+{guess.toFixed(1)}°C</span>
            </div>
            <input
              ref={sliderRef}
              type="range"
              min={q.min}
              max={q.max}
              step={0.1}
              value={guess}
              aria-label={t("quiz.slider")}
              onChange={(e) => setGuess(Number(e.target.value))}
              style={{ width: "100%", accentColor: tokens.accent, height: 30 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: tokens.textFaint }}>
              <span>+0°C</span><span>+3°C</span><span>+6°C</span>
            </div>
            <button
              onClick={() => { setRevealed(true); markSeen(); track("quiz_complete", { off: Math.round(Math.abs(guess - q!.actualDT) * 10) / 10 }); }}
              style={{ width: "100%", marginTop: 14, padding: "11px 0", fontSize: 15, borderRadius: tokens.radiusSm, border: `1.5px solid ${tokens.accent}`, background: "#0c4a6e", color: tokens.text, cursor: "pointer", fontWeight: 700 }}
            >
              🔍 {t("quiz.reveal")}
            </button>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", margin: "6px 0 2px" }}>
              <div style={{ fontSize: 44 }}>{MEDALS[idx]}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: idx <= 1 ? tokens.veg : idx <= 2 ? "#fbbf24" : tokens.warm }}>
                {DIFFS[locale][idx]}
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: tokens.textMuted }}>
                {fmt("quiz.youGuessed", { guess: `+${guess.toFixed(1)}°C` })}
              </div>
              <div style={{ marginTop: 6 }}>
                <span style={{ fontSize: 13, color: tokens.textMuted }}>{t("quiz.actual")}</span>{" "}
                <strong style={{ fontSize: 26, color: tokens.textStrong, fontVariantNumeric: "tabular-nums" }}>+{q.actualDT.toFixed(1)}°C</strong>
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: diff < 0.3 ? tokens.veg : under ? tokens.warm : "#fbbf24", fontWeight: 600 }}>
                {fmt("quiz.offBy", { diff: diff.toFixed(1), dir: t(under ? "quiz.under" : "quiz.over") })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                onClick={close}
                style={{ flex: 1, padding: "11px 0", fontSize: 14, borderRadius: tokens.radiusSm, border: `1.5px solid ${tokens.accent}`, background: "#0c4a6e", color: tokens.text, cursor: "pointer", fontWeight: 700 }}
              >
                ▶ {t("quiz.explore")}
              </button>
              <button
                onClick={() => { close(); onMore(); }}
                style={{ flex: 1, padding: "11px 0", fontSize: 14, borderRadius: tokens.radiusSm, border: `1px solid ${tokens.panelBorder}`, background: "rgba(7,11,20,0.6)", color: tokens.textMuted, cursor: "pointer" }}
              >
                🎮 {t("quiz.more")}
              </button>
            </div>
          </>
        )}
        {!revealed && (
          <button onClick={close} style={{ marginTop: 10, background: "none", border: "none", color: tokens.textFaint, cursor: "pointer", fontSize: 12, padding: 0 }}>
            {t("quiz.skip")}
          </button>
        )}
      </div>
    </div>
  );
}
