/** sparkPath：Sparkline（SVG）与 city-card（canvas）共用的折线坐标映射——单一事实源。
 *  输入值序列（null 断开），输出分段折线的坐标点数组；调用方自行串成 path 字符串或 moveTo/lineTo。 */
export interface SparkPoint { x: number; y: number }

export function sparkPoints(
  values: Array<number | null>,
  width: number,
  height: number,
  opts: { pad?: number; bottom?: number } = {},
): SparkPoint[][] {
  const pad = opts.pad ?? 3;
  const bottom = opts.bottom ?? 8;
  const n = values.length;
  if (n < 2) return [];
  const finite = values.map((v) => (v === null || !Number.isFinite(v) ? null : v));
  const all = finite.filter((v): v is number => v !== null);
  if (all.length === 0) return [];
  let lo = Math.min(...all), hi = Math.max(...all);
  const span = hi - lo || 1;
  lo -= span * 0.1; hi += span * 0.1;
  const X = (i: number) => pad + (i / Math.max(n - 1, 1)) * (width - pad * 2);
  const Y = (v: number) => pad + (1 - (v - lo) / (hi - lo)) * (height - pad * 2 - bottom);
  // 连续有限值分段
  const segs: SparkPoint[][] = [];
  let cur: SparkPoint[] = [];
  for (let i = 0; i < n; i++) {
    const v = finite[i] ?? null;
    if (v !== null) cur.push({ x: X(i), y: Y(v) });
    else if (cur.length > 0) { segs.push(cur); cur = []; }
  }
  if (cur.length > 0) segs.push(cur);
  return segs;
}
