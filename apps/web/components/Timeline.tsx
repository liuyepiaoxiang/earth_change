"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/i18n";

const MIN = 2026;
const MAX = 2500;

export default function Timeline({
  year,
  onChange,
  disabled,
}: {
  year: number;
  onChange: (y: number | ((prev: number) => number)) => void;
  disabled?: boolean;
}) {
  // 自动播放（F18 增强）：约 60 年/秒。播放时钟用 setInterval（250ms 提交一次 ≈ 15 年）——
  // 不用 rAF：每次提交触发整页重渲染（points 重算），渲染耗时会拖停 rAF 致播放卡顿；
  // setInterval 由定时器驱动，与渲染耗时解耦。
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!playing || disabled) return;
    const STEP_YEARS = 15; // 250ms × 15 年 = 60 年/秒
    intervalRef.current = setInterval(() => {
      onChange((y: number) => {
        const next = y + STEP_YEARS;
        if (next >= MAX) {
          setPlaying(false);
          return MAX;
        }
        return next;
      });
    }, 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, disabled, onChange]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", position: "relative", flexWrap: "wrap" }}>
      <button
        onClick={() => {
          if (year >= MAX) onChange(MIN); // 端点重播
          setPlaying((v) => !v);
        }}
        disabled={disabled}
        aria-label={playing ? t("timeline.pause") : t("timeline.play")}
        title={t("timeline.autoTitle")}
        className={playing ? "fe-breathe" : undefined}
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          cursor: disabled ? "not-allowed" : "pointer",
          border: "1px solid #334155",
          background: playing ? "#0c4a6e" : "transparent",
          color: "#7dd3fc",
          fontSize: 10,
          display: "grid",
          placeItems: "center",
          padding: 0,
        }}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <span style={{ fontSize: 12, color: "#64748b" }}>2026</span>
      <input
        type="range"
        min={MIN}
        max={MAX}
        step={1}
        value={year}
        disabled={disabled}
        onChange={(e) => {
          setPlaying(false); // 手动拖动即停
          onChange(Number(e.target.value));
        }}
        style={{ flex: 1, accentColor: "#38bdf8" }}
      />
      <div aria-label={t("timeline.keyYears")} style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 9, color: "#475569", position: "absolute", bottom: -2, left: 0, right: 0, pointerEvents: "none" }}>
        {[2030, 2050, 2100, 2200, 2500].map((y) => <span key={y}>|{y}</span>)}
      </div>
      <span style={{ fontSize: 12, color: "#64748b" }}>2500</span>
      <strong style={{ minWidth: 52, textAlign: "center", color: "#f8fafc", fontSize: 18, letterSpacing: 0.5, fontVariantNumeric: "tabular-nums" }}>
        <span data-testid="timeline-year">{year}</span>{year > 2100 && (
          <span title="2100 年后为探索性外推，置信度低于 AR6 校准区间" style={{ color: "#fbbf24", fontSize: 11, marginLeft: 6, border: "1px solid rgba(251, 191, 36, 0.35)", background: "rgba(251, 191, 36, 0.10)", borderRadius: 6, padding: "1px 6px" }}>{t("timeline.extrapolation")}</span>
        )}
      </strong>
    </div>
  );
}
