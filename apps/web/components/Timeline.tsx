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
  // 自动播放（F18）：每年 ~40ms 步进（25 年/秒），拖动或到端点即停
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);

  useEffect(() => {
    if (!playing || disabled) return;
    const tick = (t: number) => {
      if (t - lastRef.current >= 40) {
        lastRef.current = t;
        onChange((y: number) => {
          if (y >= MAX) {
            setPlaying(false);
            return y;
          }
          return y + 1;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
        title="自动播放时间演化（25 年/秒）"
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
        {year}
      </strong>
    </div>
  );
}
