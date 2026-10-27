"use client";
/** 🌍 今日地球——实时气候数据卡片（NOAA CO₂ + NASA 温度 + 海平面趋势） */
import { useEffect, useState } from "react";
import Link from "next/link";

interface LiveData {
  co2: { value: number; date: string; trend: string } | null;
  temperature: { anomaly: number; month: string; trend?: string } | null;
  seaLevel: { trend: number; note: string } | null;
  fetchedAt: string;
}

const card: React.CSSProperties = {
  background: "linear-gradient(135deg, #0f172a 0%, #1a1a2e 100%)",
  borderRadius: 12,
  border: "1px solid #334155",
  padding: 14,
  flex: 1,
  minWidth: 130,
};

function StatCard(props: { icon: string; label: string; value: string; sub: string; color: string; trend?: string }) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{props.icon}</span>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>{props.label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: "bold", color: props.color, fontVariantNumeric: "tabular-nums" }}>
        {props.value}
        {props.trend && <span style={{ fontSize: 13, marginLeft: 4, opacity: 0.7 }}>{props.trend}</span>}
      </div>
      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{props.sub}</div>
    </div>
  );
}

export default function LiveEarth() {
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/live")
      .then((r) => r.json())
      .then((d: LiveData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div data-testid="live-earth" style={{ padding: "10px 16px", background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
        <div style={{ display: "flex", gap: 8, color: "#64748b", fontSize: 12, alignItems: "center" }}>
          <span style={{ animation: "pulse 1.5s infinite" }}>🌍</span> 正在获取实时数据…
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div data-testid="live-earth" style={{ padding: "8px 16px", background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, color: "#7dd3fc", fontWeight: "bold", whiteSpace: "nowrap" }}>
          🌍 今日地球
        </div>
        <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" }}>
          {data.co2 && (
            <StatCard
              icon="💨"
              label="CO₂ 浓度"
              value={`${data.co2.value.toFixed(1)}`}
              sub={`ppm · ${data.co2.date} · 工业化前 280`}
              color="#a3e635"
              trend={data.co2.trend}
            />
          )}
          {data.temperature && (
            <StatCard
              icon="🌡️"
              label="温度异常"
              value={`+${data.temperature.anomaly.toFixed(2)}°C`}
              sub={`vs 工业化前 · ${data.temperature.month}`}
              color="#f87171"
              trend={data.temperature.trend}
            />
          )}
          {data.seaLevel && (
            <StatCard
              icon="🌊"
              label="海平面趋势"
              value={`+${data.seaLevel.trend}`}
              sub="mm/yr · 卫星高度计"
              color="#38bdf8"
              trend="↑"
            />
          )}
          <Link
            href="/ask"
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              background: "#0c4a6e", color: "#e0f2fe", borderRadius: 10,
              textDecoration: "none", fontSize: 12, fontWeight: "bold", border: "1px solid #38bdf8",
              whiteSpace: "nowrap",
            }}
          >
            🤖 AI 问答
          </Link>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
