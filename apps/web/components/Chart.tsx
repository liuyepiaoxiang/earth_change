"use client";
/** 通用 SVG 折线图底座：多序列 + 可选 p10-p90 阴影带 + 当前年标记（v0.2 自绘，零依赖） */
export interface ChartSeries { name: string; color: string; values: number[]; dashed?: boolean }
export interface ChartBand { color: string; p10: number[]; p90: number[] }

export default function Chart(props: {
  years: number[]; series: ChartSeries[]; band?: ChartBand; unit: string;
  markerX?: number; height?: number; yZero?: boolean;
}) {
  const { years, series, band, unit, markerX, height = 280, yZero } = props;
  const W = 640, H = height, L = 44, R = 10, T = 10, B = 24;
  if (years.length === 0) return <div>无数据</div>;
  const x0 = years[0]!, x1 = years[years.length - 1]!;
  const all = series.flatMap((s) => s.values).concat(band ? [...band.p10, ...band.p90] : [], yZero ? [0] : []);
  const yMin = Math.min(...all), yMax = Math.max(...all);
  const pad = (yMax - yMin) * 0.06 || 1;
  const lo = yMin - pad, hi = yMax + pad;
  const X = (y: number) => L + ((y - x0) / (x1 - x0)) * (W - L - R);
  const Y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const path = (vs: number[]) => vs.map((v, i) => `${i === 0 ? "M" : "L"}${X(years[i]!).toFixed(1)},${Y(v).toFixed(1)}`).join("");
  const bandPath = band
    ? path(band.p90) + band.p10.map((v, i) => `L${X(years[years.length - 1 - i]!).toFixed(1)},${Y(band.p10[band.p10.length - 1 - i]!).toFixed(1)}`).join("")
    : "";
  const ticks = [lo, (lo + hi) / 2, hi];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img" aria-label={`图表 ${series.map((s) => s.name).join("，")} 单位 ${unit}`}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} stroke="#1e293b" strokeWidth={0.5} />
          <text x={4} y={Y(t) + 3} fill="#64748b" fontSize={9}>{t.toFixed(Math.abs(hi - lo) < 3 ? 2 : 1)}</text>
        </g>
      ))}
      {yZero !== undefined && lo < 0 && hi > 0 && <line x1={L} x2={W - R} y1={Y(0)} y2={Y(0)} stroke="#475569" strokeWidth={0.7} />}
      {[x0, Math.round((x0 + x1) / 2), x1].map((y, i) => (
        <text key={i} x={X(y)} y={H - 8} fill="#64748b" fontSize={9} textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}>{y}</text>
      ))}
      {band && <path d={bandPath} fill={band.color} opacity={0.22} />}
      {series.map((s) => (
        <path key={s.name} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={1.4} strokeDasharray={s.dashed ? "4 3" : undefined} />
      ))}
      {markerX !== undefined && markerX >= x0 && markerX <= x1 && (
        <line x1={X(markerX)} x2={X(markerX)} y1={T} y2={H - B} stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 2" />
      )}
      <g>
        {series.map((s, i) => (
          <g key={s.name} transform={`translate(${L + 6 + i * 96}, ${T + 8})`}>
            <rect width={10} height={3} y={3} fill={s.color} />
            <text x={14} y={7} fontSize={12} fill="#94a3b8">{s.name}</text>
          </g>
        ))}
      </g>
      <text x={W - R} y={T + 8} fontSize={12} fill="#64748b" textAnchor="end">{unit}</text>
    </svg>
  );
}
