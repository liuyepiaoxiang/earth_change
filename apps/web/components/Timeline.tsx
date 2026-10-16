"use client";
import { useEffect, useRef, useState } from "react";

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
    <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
      <button
        onClick={() => {
          if (year >= MAX) onChange(MIN); // 端点重播
          setPlaying((v) => !v);
        }}
        disabled={disabled}
        aria-label={playing ? "暂停时间轴播放" : "播放时间演化"}
        title="自动播放时间演化（约 60 年/秒）"
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
      <span style={{ fontSize: 12, color: "#64748b" }}>2500</span>
      <strong style={{ minWidth: 52, textAlign: "center", color: "#e0f2fe", fontVariantNumeric: "tabular-nums" }}>
        {year}{year > 2100 && (
          <span title="2100 年后为探索性外推，置信度低于 AR6 校准区间" style={{ color: "#f59e0b", fontSize: 11, marginLeft: 6, border: "1px solid #92400e", borderRadius: 6, padding: "1px 6px" }}>探索性外推</span>
        )}
      </strong>
    </div>
  );
}
