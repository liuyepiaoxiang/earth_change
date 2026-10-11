/** 设计令牌（F13 可视化规范）：面板/文字/边框/强调色的单一来源，深色主题 */
export const tokens = {
  bg: "#05070f",
  panel: "rgba(8, 15, 30, 0.88)",
  panelBorder: "#1e293b",
  panelBorderActive: "#334155",
  text: "#e2e8f0",
  textStrong: "#e0f2fe",
  textMuted: "#94a3b8",
  textFaint: "#64748b",
  textDisabled: "#475569",
  accent: "#38bdf8",
  accentSoft: "#5b7fa6",
  radius: 10,
  radiusSm: 6,
  fontNum: 'tabular-nums',
} as const;

/** 面板容器通用样式（图层/图例/城市面板共用） */
export const panelStyle = {
  background: tokens.panel,
  border: `1px solid ${tokens.panelBorder}`,
  borderRadius: tokens.radius,
  backdropFilter: "blur(4px)",
} as const;
