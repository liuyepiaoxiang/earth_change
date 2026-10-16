"use client";
/** V1.0 区域统计与点采样（V10-E04 用户界面）：输入经纬度/框选四至 → 引擎网格场统计 */
import { useMemo, useState } from "react";
import { anomalyField, temperatureField, precipField, sampleGrid, regionStats, gridBiome, GRID } from "@future-earth/engine";
import { cellIndexOf } from "@future-earth/data";
import type { SimResultWithUnc } from "../lib/sim";

const num = (v: string): number => Number(v);
const input: React.CSSProperties = { width: 64, background: "#0f172a", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 6, padding: 4, fontSize: 12 };
const btn: React.CSSProperties = { padding: "4px 10px", fontSize: 12, borderRadius: 6, cursor: "pointer", border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0" };

export default function RegionPanel(props: { sim: SimResultWithUnc; year: number }) {
  const { sim, year } = props;
  const [lat, setLat] = useState("39.9");
  const [lon, setLon] = useState("116.4");
  const [box, setBox] = useState({ s: "10", n: "30", w: "-10", e: "30" });

  const point = useMemo(() => {
    const { i } = cellIndexOf(num(lat), num(lon));
    return {
      anomaly: sampleGrid(anomalyField(sim, year), num(lat), num(lon)),
      temperature: sampleGrid(temperatureField(sim, year), num(lat), num(lon)),
      precip: sampleGrid(precipField(sim, year), num(lat), num(lon)),
      biome: gridBiome(sim, i, year),
    };
  }, [sim, year, lat, lon]);

  const stats = useMemo(() => ({
    anomaly: regionStats(anomalyField(sim, year), num(box.s), num(box.n), num(box.w), num(box.e)),
    temperature: regionStats(temperatureField(sim, year), num(box.s), num(box.n), num(box.w), num(box.e)),
    precip: regionStats(precipField(sim, year), num(box.s), num(box.n), num(box.w), num(box.e)),
  }), [sim, year, box]);

  return (
    <div data-testid="region-panel" style={{ fontSize: 12, color: "#94a3b8" }}>
      <b style={{ color: "#e0f2fe" }}>点采样（{GRID.res}° 格）</b>
      <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "6px 0" }}>
        纬 <input style={input} value={lat} aria-label="纬度" onChange={(e) => setLat(e.target.value)} />
        经 <input style={input} value={lon} aria-label="经度" onChange={(e) => setLon(e.target.value)} />
      </div>
      <table data-testid="point-sample" style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
        <tbody>
          <tr><td style={{ padding: 3 }}>温度异常</td><td>{point.anomaly?.toFixed(2) ?? "—"} °C</td></tr>
          <tr><td style={{ padding: 3 }}>年均温</td><td>{point.temperature?.toFixed(1) ?? "—"} °C</td></tr>
          <tr><td style={{ padding: 3 }}>年降水</td><td>{point.precip?.toFixed(0) ?? "—"} mm</td></tr>
          <tr><td style={{ padding: 3 }}>群系</td><td>{point.biome ?? "海洋/缺测"}</td></tr>
        </tbody>
      </table>
      <b style={{ color: "#e0f2fe", display: "block", marginTop: 10 }}>区域统计（面积加权）</b>
      <div style={{ display: "flex", gap: 4, alignItems: "center", margin: "6px 0", flexWrap: "wrap" }}>
        南 <input style={input} value={box.s} aria-label="南纬" onChange={(e) => setBox({ ...box, s: e.target.value })} />
        北 <input style={input} value={box.n} aria-label="北纬" onChange={(e) => setBox({ ...box, n: e.target.value })} />
        西 <input style={input} value={box.w} aria-label="西经" onChange={(e) => setBox({ ...box, w: e.target.value })} />
        东 <input style={input} value={box.e} aria-label="东经" onChange={(e) => setBox({ ...box, e: e.target.value })} />
      </div>
      <table data-testid="region-stats" style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
        <thead><tr>{["场", "格数", "均值", "最小", "P10", "P90", "最大"].map((h) => (
          <th key={h} style={{ textAlign: "left", padding: 3, borderBottom: "1px solid #334155", color: "#cbd5e1" }}>{h}</th>
        ))}</tr></thead>
        <tbody>
          {([["温度异常 °C", stats.anomaly], ["年均温 °C", stats.temperature], ["降水 mm", stats.precip]] as const).map(([label, st]) => (
            <tr key={label}>
              <td style={{ padding: 3 }}>{label}</td>
              <td style={{ padding: 3 }}>{st?.n ?? "—"}</td>
              <td style={{ padding: 3 }}>{st ? st.mean.toFixed(1) : "—"}</td>
              <td style={{ padding: 3 }}>{st ? st.min.toFixed(1) : "—"}</td>
              <td style={{ padding: 3 }}>{st ? st.p10.toFixed(1) : "—"}</td>
              <td style={{ padding: 3 }}>{st ? st.p90.toFixed(1) : "—"}</td>
              <td style={{ padding: 3 }}>{st ? st.max.toFixed(1) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: "#475569", marginTop: 8 }}>场 = 基准气候网格（WorldClim/ETOPO 聚合）+ 全球模拟模式缩放；海洋格缺测不计入统计。</p>
    </div>
  );
}
