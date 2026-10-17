"use client";
/** V4.1 大事记——里程碑时间线 + 点击跳转年份 */
import { useMemo } from "react";
import { milestoneEvents } from "@future-earth/engine";
import type { SimResultWithUnc } from "../lib/sim";

const COLORS: Record<string, string> = {
  temperature: "#f87171", sea: "#38bdf8", ice: "#a5f3fc", carbon: "#a78bfa", impact: "#fbbf24", ecosystem: "#4ade80",
};

export default function MilestoneFeed(props: { sim: SimResultWithUnc; year: number; onJump: (y: number) => void }) {
  const events = useMemo(() => milestoneEvents(props.sim), [props.sim]);
  if (events.length === 0) return <div style={{ color: "#64748b", fontSize: 12 }}>该情景在 2025–2500 年内无里程碑事件触发。</div>;
  return (
    <div data-testid="milestone-feed" style={{ fontSize: 12 }}>
      <p style={{ color: "#94a3b8", marginBottom: 8 }}>共 {events.length} 个里程碑事件——点击跳转到该年份</p>
      <div style={{ display: "grid", gap: 6 }}>
        {events.map((e, i) => {
          const color = COLORS[e.category] ?? "#94a3b8";
          const isPast = e.year <= props.year;
          return (
            <button key={i} onClick={() => props.onJump(e.year)} style={{
              display: "flex", gap: 10, alignItems: "center", padding: "6px 10px", cursor: "pointer",
              border: `1px solid ${isPast ? color : "#1e293b"}`, borderRadius: 8,
              background: isPast ? `${color}18` : "transparent", textAlign: "left", opacity: isPast ? 1 : 0.6,
            }}>
              <span style={{ fontSize: 20 }}>{e.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: isPast ? color : "#94a3b8", fontSize: 12, fontWeight: isPast ? "bold" : "normal" }}>{e.title}</div>
                <div style={{ color: "#64748b", fontSize: 10, marginTop: 1 }}>{e.description}</div>
              </div>
              <span style={{ color: isPast ? "#e0f2fe" : "#475569", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{e.year}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
