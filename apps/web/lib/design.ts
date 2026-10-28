/** 设计令牌（F13 可视化规范）：面板/文字/边框/强调色的单一来源，深色主题
 *  v2 视觉打磨：三级背景深度 + 语义色板 + 柔和阴影 */
export const tokens = {
  /** 最底层：带蓝调的深空底色（替代死黑） */
  bg: "#070b14",
  /** 页面主体层 */
  bgBody: "#0b1120",
  /** 卡片/面板层 */
  panel: "rgba(13, 18, 34, 0.88)",
  panelBorder: "rgba(148, 163, 184, 0.16)",
  panelBorderActive: "rgba(56, 189, 248, 0.45)",
  text: "#e2e8f0",
  textStrong: "#f1f5f9",
  textMuted: "#94a3b8",
  textFaint: "#64748b",
  textDisabled: "#475569",
  accent: "#38bdf8",
  accentSoft: "#5b7fa6",
  /** 语义色板：温度=暖橙红，水/海平面=天蓝，植被=绿（≤3 种语义色，UI 其余用中性灰蓝） */
  warm: "#fb7185",
  warmStrong: "#ef4444",
  water: "#38bdf8",
  veg: "#4ade80",
  /** 选中态填充（segmented control） */
  activeFill: "#1d4ed8",
  radius: 12,
  radiusSm: 8,
  fontNum: 'tabular-nums',
  /** 悬浮面板阴影：制造与背景的分离感 */
  shadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
  shadowGlow: "0 0 48px rgba(56, 189, 248, 0.10)",
} as const;

/** 面板容器通用样式（图层/图例/城市面板共用）——毛玻璃卡片 */
export const panelStyle = {
  background: tokens.panel,
  border: `1px solid ${tokens.panelBorder}`,
  borderRadius: tokens.radius,
  backdropFilter: "blur(8px)",
  boxShadow: tokens.shadow,
} as const;
