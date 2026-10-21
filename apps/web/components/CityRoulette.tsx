"use client";
/** 🎰 城市命运轮盘——随机抽一个城市，看它在未来的命运 */
import { useMemo, useState } from "react";
import { loadCities } from "@future-earth/data";
import { isCityFlooded, localDTs } from "@future-earth/engine";
import type { SimResultWithUnc } from "../lib/sim";
import type { MetricsSnapshot } from "../lib/sim";

import type { WarmingPatternBand } from "@future-earth/engine";

const FORTUNES = [
  { icon: "🏝️", label: "度假天堂", desc: "海风轻拂，游人如织——海平面还远没有威胁到这里" },
  { icon: "⚠️", label: "警钟初响", desc: "海平面正在逼近——沿海基础设施面临压力" },
  { icon: "🌊", label: "与海共舞", desc: "部分低洼区已开始周期性淹没，防护工程加速" },
  { icon: "🚨", label: "城市保卫战", desc: "海平面已超过历史高程——需要大规模防护或撤退" },
  { icon: "🌊💀", label: " Atlantis 时刻", desc: "在当前城市点级判定下已完全淹没——海平面远超高程" },
];

export default function CityRoulette(props: { sim: SimResultWithUnc; snap: MetricsSnapshot | null; pattern: WarmingPatternBand[]; onSelectCity: (city: import("@future-earth/data").CityRow) => void }) {
  const cities = useMemo(() => loadCities(), []);
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<import("@future-earth/data").CityRow | null>(null);

  const spin = () => {
    setSpinning(true);
    setPicked(null);
    setTimeout(() => {
      const c = cities[Math.floor(Math.random() * cities.length)]!;
      setPicked(c);
      setSpinning(false);
    }, 1200);
  };

  if (!props.snap || !picked) return (
    <div data-testid="city-roulette" style={{ textAlign: "center", padding: 20 }}>
      <div style={{ fontSize: 48, marginBottom: 8, animation: spinning ? "spin 0.3s linear infinite" : undefined }}>🎰</div>
      <h3 style={{ color: "#e0f2fe", fontSize: 16, margin: "0 0 6px" }}>城市命运轮盘</h3>
      <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 16px" }}>随机抽一个城市，看它在 {props.snap?.year ?? "?"} 年的命运</p>
      <button onClick={spin} disabled={spinning} style={{ padding: "10px 24px", fontSize: 15, borderRadius: 10, border: `2px solid ${spinning ? "#334155" : "#fbbf24"}`, background: spinning ? "#1e293b" : "#78350f", color: spinning ? "#64748b" : "#fef3c7", cursor: spinning ? "not-allowed" : "pointer", fontWeight: "bold" }}>
        {spinning ? "🎰 转动中..." : "🎰 抽一个城市"}
      </button>
      {spinning && <style>{`@keyframes spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }`}</style>}
    </div>
  );

  const dt = localDTs(props.snap.tempAnomaly, picked.lat, props.pattern.length ? props.pattern : undefined);
  const flooded = isCityFlooded(picked.elevation, props.snap.seaLevel.total);
  const aboveM = picked.elevation - props.snap.seaLevel.total;
  const fIdx = flooded ? 4 : aboveM < 2 ? 3 : aboveM < 5 ? 2 : aboveM < 20 ? 1 : 0;
  const fortune = FORTUNES[fIdx]!;

  return (
    <div data-testid="roulette-result" style={{ padding: 16 }}>
      <div style={{ background: "#0f172a", borderRadius: 12, border: "1px solid #334155", padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 4 }}>{fortune.icon}</div>
        <h3 style={{ color: "#e0f2fe", fontSize: 16, margin: "0 0 2px" }}>{picked.name}（{picked.country}）</h3>
        <div style={{ color: fortune.icon.includes("💀") || fortune.icon.includes("🚨") ? "#f87171" : fortune.icon.includes("🌊") || fortune.icon.includes("⚠️") ? "#fbbf24" : "#4ade80", fontSize: 14, fontWeight: "bold" }}>
          {fortune.label}
        </div>
        <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 8 }}>{fortune.desc}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, fontSize: 13 }}>
          <div style={{ background: "#1e293b", borderRadius: 8, padding: 8 }}>
            <div style={{ color: "#64748b", fontSize: 12 }}>高程</div>
            <div style={{ color: "#e0f2fe" }}>{picked.elevation} m</div>
          </div>
          <div style={{ background: "#1e293b", borderRadius: 8, padding: 8 }}>
            <div style={{ color: "#64748b", fontSize: 12 }}>本地升温</div>
            <div style={{ color: "#f87171" }}>+{dt.toFixed(1)}°C</div>
          </div>
          <div style={{ background: "#1e293b", borderRadius: 8, padding: 8 }}>
            <div style={{ color: "#64748b", fontSize: 12 }}>人口</div>
            <div style={{ color: "#e0f2fe" }}>{(picked.population / 1e6).toFixed(1)}M</div>
          </div>
          <div style={{ background: "#1e293b", borderRadius: 8, padding: 8 }}>
            <div style={{ color: "#64748b", fontSize: 12 }}>距海平面</div>
            <div style={{ color: aboveM > 0 ? "#4ade80" : "#f87171" }}>{aboveM > 0 ? `+${aboveM.toFixed(1)} m` : `${Math.abs(aboveM).toFixed(1)} m 已淹`}</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => props.onSelectCity(picked)} style={{ flex: 1, padding: "8px 0", fontSize: 14, borderRadius: 8, border: "1px solid #38bdf8", background: "#0c4a6e", color: "#e0f2fe", cursor: "pointer" }}>📍 在地球上看</button>
        <button onClick={spin} style={{ flex: 1, padding: "8px 0", fontSize: 14, borderRadius: 8, border: "1px solid #fbbf24", background: "#78350f", color: "#fef3c7", cursor: "pointer" }}>🎰 再抽</button>
      </div>
    </div>
  );
}
