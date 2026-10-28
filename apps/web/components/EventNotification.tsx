"use client";
/** V4.1 事件通知卡片——播放/拖动到达事件年份时弹出（自动消失） */
import { useEffect, useState } from "react";
import type { MilestoneEvent } from "@future-earth/engine";
import { useI18n } from "../lib/i18n";

export default function EventNotification(props: { event: MilestoneEvent | null; onDismiss: () => void }) {
  const { locale } = useI18n();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (props.event) { setVisible(true); const t = setTimeout(() => { setVisible(false); props.onDismiss(); }, 5000); return () => clearTimeout(t); }
  }, [props.event?.year, props.event?.title]);
  if (!props.event || !visible) return null;
  const color = { temperature: "#f87171", sea: "#38bdf8", ice: "#a5f3fc", carbon: "#a78bfa", impact: "#fbbf24", ecosystem: "#4ade80" }[props.event.category];
  return (
    <div data-testid="event-notification" style={{
      position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
      background: "rgba(8,15,30,0.95)", border: `1px solid ${color}`, borderRadius: 12,
      padding: "12px 20px", zIndex: 50, maxWidth: 420, boxShadow: `0 4px 24px ${color}33`,
      animation: "slideIn 0.3s ease-out",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 28 }}>{props.event.icon}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: "bold", color }}>{locale === "en" ? (props.event.titleEn ?? props.event.title) : props.event.title}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{props.event.year}{locale === "en" ? "" : " 年"} · {locale === "en" ? (props.event.descriptionEn ?? props.event.description) : props.event.description}</div>
        </div>
      </div>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(-50%) translateY(-16px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }`}</style>
    </div>
  );
}
