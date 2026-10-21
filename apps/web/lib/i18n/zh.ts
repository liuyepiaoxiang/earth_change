/** 中文字典 */
export const zh = {
  // Header
  "app.title": "未来地球引擎",
  "app.nav.earth": "地球",
  "app.nav.overview": "导览",
  "app.btn.uncertainty": "±区间",
  "app.btn.analysis": "📊 分析",
  "app.btn.experiment": "🧪 实验",
  // Tabs
  "tab.games": "🎮 趣玩",
  "tab.missions": "🎓 任务",
  "tab.milestones": "大事记",
  "tab.timeseries": "时间序列",
  "tab.obsCompare": "观测对照",
  "tab.slrComponents": "海平面分量",
  "tab.contribution": "为什么会这样",
  "tab.metadata": "结果说明",
  "tab.compare": "对比",
  "tab.region": "区域",
  "tab.impact": "影响",
  "tab.lab": "实验室",
  "tab.share": "分享",
  // Timeline
  "timeline.extrapolation": "探索性外推",
  "timeline.play": "播放时间演化",
  // Metrics
  "metric.seaIce": "海冰",
  "metric.vegetation": "植被",
  "metric.permafrost": "冻土",
  "metric.thermal": "热膨",
  "metric.glacier": "冰川",
  "metric.iceSheet": "冰盖",
  "metric.landWater": "陆水",
  // City
  "city.flooded": "⚠ 已被海平面淹没",
  "city.safe": "未淹没",
  "city.elevation": "高程",
  "city.localWarming": "本地升温",
  "city.futureTemp": "未来年均温",
  "city.precip": "降水",
  "city.biome": "群系",
  "city.close": "关闭",
  // Share
  "share.title": "可复现链接",
  "share.copy": "复制",
  "share.copied": "✅ 已复制",
  "share.csv": "⬇ 导出 CSV",
  "share.png": "🖼 导出 PNG",
  "share.social": "社交分享",
  "share.x": "𝕏 分享到 X",
  "share.copyText": "复制文案",
  // Common
  "common.loading": "引擎装载中…",
  "common.close": "关闭",
  "common.year": "年",
} as const;
export type TranslationKey = keyof typeof zh;
