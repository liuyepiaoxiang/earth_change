/** 温度异常色阶（可视化设计规范 F13）——感知有序的发散色阶。
 *  设计原则：
 *  - 信：ΔT 是相对 1850 的异常 → 用以 0 为中性锚点的发散色阶（ColorBrewer RdYlBu 反转系），
 *    取代早期的 hue 旋转彩虹色阶（彩虹中段绿/黄引导误读，且对色盲不友好）；
 *  - 达：色阶 stops 同时驱动 3D 点云着色与图例 Colorbar（单一事实源，杜绝图例与实际色标漂移）；
 *  - 雅：分段线性插值 + 端点钳制，无突变。 */

export interface ColorStop {
  /** 温度异常锚点（°C，相对 1850） */
  v: number;
  /** RGB 0–255 */
  c: [number, number, number];
}

/** 温度异常色域：[−3, +8]°C（历史段 0→1.4 占据中性区；SSP5-8.5 2500 ≈ +10 饱和于深红） */
export const TEMP_DOMAIN: readonly [number, number] = [-3, 8];

/** ColorBrewer RdYlBu 反转发散色阶（0 = 近白中性） */
export const TEMP_STOPS: readonly ColorStop[] = [
  { v: -3, c: [8, 48, 107] }, // 深蓝（强冷却）
  { v: -1, c: [33, 113, 181] },
  { v: -0.3, c: [158, 202, 225] },
  { v: 0, c: [232, 238, 247] }, // 近白中性（无异常）
  { v: 1, c: [254, 224, 144] }, // 浅暖黄
  { v: 2, c: [253, 174, 97] }, // 橙
  { v: 3, c: [244, 109, 67] },
  { v: 4, c: [215, 48, 39] }, // 红
  { v: 6, c: [165, 0, 38] }, // 深红
  { v: 8, c: [103, 0, 13] }, // 极端暖（钳制端）
];

/** 分段线性插值 + 端点钳制，返回 [r, g, b] */
export function tempColorRgb(dt: number): [number, number, number] {
  const v = Math.min(TEMP_DOMAIN[1], Math.max(TEMP_DOMAIN[0], dt));
  if (v <= TEMP_STOPS[0]!.v) return [...TEMP_STOPS[0]!.c] as [number, number, number];
  for (let i = 1; i < TEMP_STOPS.length; i++) {
    const hi = TEMP_STOPS[i]!;
    if (v <= hi.v) {
      const lo = TEMP_STOPS[i - 1]!;
      const t = (v - lo.v) / (hi.v - lo.v);
      return [
        Math.round(lo.c[0] + (hi.c[0] - lo.c[0]) * t),
        Math.round(lo.c[1] + (hi.c[1] - lo.c[1]) * t),
        Math.round(lo.c[2] + (hi.c[2] - lo.c[2]) * t),
      ];
    }
  }
  return [...TEMP_STOPS[TEMP_STOPS.length - 1]!.c] as [number, number, number];
}

/** 十六进制色串（供 three.js 材质与 CSS 共用） */
export function tempColorHex(dt: number): string {
  const [r, g, b] = tempColorRgb(dt);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Colorbar 用的 CSS 渐变串（与 3D 点云同源） */
export function tempColorCssGradient(): string {
  const [dMin, dMax] = TEMP_DOMAIN;
  const parts = TEMP_STOPS.map((s) => {
    const t = ((s.v - dMin) / (dMax - dMin)) * 100;
    const [r, g, b] = s.c;
    return `rgb(${r},${g},${b}) ${t.toFixed(1)}%`;
  });
  return `linear-gradient(90deg, ${parts.join(", ")})`;
}
