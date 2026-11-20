"use client";
/** 卡片内迷你时间线（F22）：零依赖 SVG 折线，无边距刻度，仅首/尾/当前年标注。
 *  - values 含 null/NaN → 断线（与 Chart 同规则）
 *  - dangerBelow：连续低于阈值的点段描红色（如淹没余量 < 0）
 *  - markerYear：当前年竖虚线（与主时间轴联动，同 Chart 的 marker 语义） */
export default function Sparkline({
  years,
  values,
  color,
  unit,
  markerYear,
  dangerBelow,
  height = 54,
  ariaLabel,
}: {
  years: number[];
  values: Array<number | null>;
  color: string;
  unit: string;
  markerYear?: number;
  dangerBelow?: number;
  height?: number;
  ariaLabel: string;
}) {
  const W = 320, H = height, PAD = 3;
  const n = Math.min(years.length, values.length);
  if (n < 2) return <div style={{ height, fontSize: 11, color: "#64748b" }}>—</div>;
  const xs = years.slice(0, n);
  const x0 = xs[0]!, x1 = xs[n - 1]!;
  const finite = values.slice(0, n).map((v) => (v === null || !Number.isFinite(v) ? null : v));
  const all = finite.filter((v): v is number => v !== null);
  if (all.length === 0) return <div style={{ height, fontSize: 11, color: "#64748b" }}>—</div>;
  let yMin = Math.min(...all), yMax = Math.max(...all);
  if (dangerBelow !== undefined) yMin = Math.min(yMin, dangerBelow), yMax = Math.max(yMax, dangerBelow);
  const pad = (yMax - yMin) * 0.1 || 1;
  const lo = yMin - pad, hi = yMax + pad;
  const X = (y: number) => PAD + ((y - x0) / (x1 - x0)) * (W - PAD * 2);
  const Y = (v: number) => PAD + (1 - (v - lo) / (hi - lo)) * (H - PAD * 2 - 8);

  // 连续有限值分段（null 断开）；段内再按 dangerBelow 拆红段
  const d = (i: number) => `L${X(xs[i]!).toFixed(1)},${Y(finite[i] as number).toFixed(1)}`;
  const segs: Array<{ i0: number; i1: number }> = [];
  let start = -1;
  for (let i = 0; i < n; i++) {
    if (finite[i] !== null) { if (start < 0) start = i; }
    else if (start >= 0) { segs.push({ i0: start, i1: i - 1 }); start = -1; }
  }
  if (start >= 0) segs.push({ i0: start, i1: n - 1 });
  const inDanger = (i: number) =>
    dangerBelow !== undefined && finite[i] !== null && (finite[i] as number) < dangerBelow;
  const paths = segs.map(({ i0, i1 }) => {
    let main = `M${X(xs[i0]!).toFixed(1)},${Y(finite[i0] as number).toFixed(1)}`;
    let red = "";
    let redOpen = false;
    for (let i = i0 + 1; i <= i1; i++) {
      main += d(i);
      if (inDanger(i)) {
        red += redOpen ? d(i) : `M${X(xs[i - 1]!).toFixed(1)},${Y(finite[i - 1] as number).toFixed(1)}${d(i)}`;
        redOpen = true;
      } else redOpen = false;
    }
    return { main, red };
  });
  const dangerY = dangerBelow !== undefined ? Y(dangerBelow) : undefined;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block" }}
      role="img"
      aria-label={`${ariaLabel}（${unit}）`}
    >
      {dangerBelow !== undefined && dangerY !== undefined && dangerY > PAD && dangerY < H - 8 && (
        <line x1={PAD} x2={W - PAD} y1={dangerY} y2={dangerY} stroke="#475569" strokeWidth={0.6} strokeDasharray="2 2" />
      )}
      {paths.map((p, k) => (
        <g key={k}>
          <path d={p.main} fill="none" stroke={color} strokeWidth={1.3} />
          {p.red && <path d={p.red} fill="none" stroke="#ef4444" strokeWidth={1.6} />}
        </g>
      ))}
      {markerYear !== undefined && markerYear >= x0 && markerYear <= x1 && (
        <line x1={X(markerYear)} x2={X(markerYear)} y1={PAD} y2={H - 8} stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 2" />
      )}
      <text x={PAD} y={H - 1} fill="#64748b" fontSize={8}>{x0}</text>
      <text x={W - PAD} y={H - 1} fill="#64748b" fontSize={8} textAnchor="end">{x1}</text>
      <text x={W - PAD} y={10} fill="#64748b" fontSize={8} textAnchor="end">{unit}</text>
    </svg>
  );
}
