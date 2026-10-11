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

// ---- F14 温度连续覆盖层（替代 5° 点云）：1D 纬度 LUT + 等温线 ----

export interface LatBand {
  latMin: number;
  latMax: number;
  amp: number;
}

/** 纬度 → 放大系数：带中心锚点线性插值（连续化离散带，端点钳制），比阶梯带诚实且平滑 */
export function patternAmpInterp(lat: number, bands: LatBand[]): number {
  const mids = bands
    .map((b) => ({ mid: (b.latMin + b.latMax) / 2, amp: b.amp }))
    .sort((a, b) => a.mid - b.mid);
  if (mids.length === 0) return 1;
  if (lat <= mids[0]!.mid) return mids[0]!.amp;
  if (lat >= mids[mids.length - 1]!.mid) return mids[mids.length - 1]!.amp;
  for (let i = 1; i < mids.length; i++) {
    if (lat <= mids[i]!.mid) {
      const a = mids[i - 1]!;
      const t = (lat - a.mid) / (mids[i]!.mid - a.mid);
      return a.amp + (mids[i]!.amp - a.amp) * t;
    }
  }
  return mids[mids.length - 1]!.amp;
}

export const TEMP_LUT_HEIGHT = 512; // 纬度 −90..90 → 512 行

/**
 * 生成温度覆盖层 LUT（1 × H RGBA，行序 = 纬度 −90 → +90，配合纹理 flipY）。
 * - 颜色 = tempColorRgb(dtGlobal × ampInterp(lat))
 * - 等温线：每 isothermStep °C 一条深色纬线（Pattern Scaling 场的等值线为纬线——诚实呈现模型本质）
 * - alpha = 覆盖透明度 × 255（海洋/陆地统一覆盖，底图透出）
 */
export function buildTempLut(
  dtGlobal: number,
  bands: LatBand[],
  opts: { isothermStep?: number; opacity?: number; height?: number } = {},
): Uint8Array<ArrayBuffer> {
  const H = opts.height ?? TEMP_LUT_HEIGHT;
  const step = opts.isothermStep ?? 1;
  const opacity = opts.opacity ?? 0.78;
  // 显式 ArrayBuffer：three 的 DataTexture 纹理数据类型要求 buffer 为 ArrayBuffer（非 Shared）
  const data = new Uint8Array(new ArrayBuffer(H * 4));
  for (let row = 0; row < H; row++) {
    const lat = -90 + (row / (H - 1)) * 180;
    const dt = dtGlobal * patternAmpInterp(lat, bands);
    const [r, g, b] = tempColorRgb(dt);
    // 等温线：|ΔT − k·step| < 线宽/2 → 局部色加深 45% + 降 alpha（观感为融入色场的
    // 纤细等值线，而非灰色间隔带——v1.2 二次修正：固定深色在球面放大后成宽灰带）
    const isLine = step > 0 && Math.abs(dt - Math.round(dt / step) * step) < (step / H) * 90 * 0.22;
    const a = Math.round((isLine ? opacity * 0.5 : opacity) * 255);
    data[row * 4] = isLine ? r * 0.55 : r;
    data[row * 4 + 1] = isLine ? g * 0.55 : g;
    data[row * 4 + 2] = isLine ? b * 0.55 : b;
    data[row * 4 + 3] = a;
  }
  return data;
}

