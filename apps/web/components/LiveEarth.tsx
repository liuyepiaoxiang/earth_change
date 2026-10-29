"use client";
/** 🌍 今日地球——实时气候数据卡片（NOAA CO₂ + NASA 温度 + 海平面趋势） */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "../lib/i18n";

interface LiveData {
  co2: { value: number; date: string; trend: string } | null;
  temperature: { anomaly: number; month: string; trend?: string } | null;
  seaLevel: { trend: number; note: string } | null;
  fetchedAt: string;
}

const card: React.CSSProperties = {
  background: "linear-gradient(160deg, rgba(21, 27, 43, 0.92) 0%, rgba(13, 18, 34, 0.92) 100%)",
  borderRadius: 12,
  border: "1px solid rgba(148, 163, 184, 0.16)",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.35)",
  padding: "12px 16px",
  flex: 1,
  minWidth: 130,
  transition: "border-color 0.2s ease",
};

function StatCard(props: { icon: string; label: string; value: string; sub: string; color: string; trend?: string }) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 17, filter: "saturate(1.1)" }}>{props.icon}</span>
        <span style={{ fontSize: 11, color: "#7c8aa0", letterSpacing: 0.2, textTransform: "uppercase", fontWeight: 600 }}>{props.label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: props.color, fontVariantNumeric: "tabular-nums", letterSpacing: 0.3, marginTop: 2 }}>
        {props.value}
        {props.trend && <span style={{ fontSize: 13, marginLeft: 4, opacity: 0.7 }}>{props.trend}</span>}
      </div>
      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{props.sub}</div>
    </div>
  );
}

export default function LiveEarth() {
  const { t } = useI18n();
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
          <span style={{ animation: "pulse 1.5s infinite" }}>🌍</span> {t("live.loading")}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div data-testid="live-earth" style={{ padding: "8px 16px", background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, color: "#7dd3fc", fontWeight: "bold", whiteSpace: "nowrap" }}>
          🌍 {t("live.title")}
        </div>
        <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" }}>
          {data.co2 && (
            <StatCard
              icon="💨"
              label={t("live.co2")}
              value={`${data.co2.value.toFixed(1)}`}
              sub={`ppm · ${data.co2.date} · ${t("live.preindustrial")}`}
              color="#a3e635"
              trend={data.co2.trend}
            />
          )}
          {data.temperature && (
            <StatCard
              icon="🌡️"
              label={t("live.temp")}
              value={`+${data.temperature.anomaly.toFixed(2)}°C`}
              sub={`${t("live.vsPre")} · ${data.temperature.month}`}
              color="#f87171"
              trend={data.temperature.trend}
            />
          )}
          {data.seaLevel && (
            <StatCard
              icon="🌊"
              label={t("live.seaLevel")}
              value={`+${data.seaLevel.trend}`}
              sub={t("live.seaLevelSub")}
              color="#38bdf8"
              trend="↑"
            />
          )}
          <Link
            href="/ask"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 16px", alignSelf: "stretch",
              background: "linear-gradient(135deg, #0e4a75 0%, #0c3a5e 100%)", color: "#e0f2fe", borderRadius: 12,
              textDecoration: "none", fontSize: 12, fontWeight: "bold", border: "1px solid rgba(56, 189, 248, 0.45)",
              boxShadow: "0 4px 16px rgba(14, 74, 117, 0.4)",
              whiteSpace: "nowrap",
            }}
          >
            💬 {t("app.nav.ask")}
          </Link>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
