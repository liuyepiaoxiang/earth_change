# 未来地球引擎 v0.3 — 情景实验室与分享实现计划

> **For agentic workers:** 按 superpowers:executing-plans 逐任务执行。步骤 `- [ ]` 跟踪。

**Goal:** 落地 docs/10 §6：情景实验室（7 控制项）、双情景对比（阈值年/受影响城市）、URL 分享态、CSV/PNG 导出、/embed、API canonicalUrl。版本号 0.3.0。

**关键设计决策：**
- 实验模式 = **排放驱动**（reshape 基准 SSP 排放路径），与 SSP 浓度驱动（AR6 锚定）对照；metadata 标注 `driverMode: "emissions-driven"` + 置信注记「教育性实验，未经 AR6 区间锚定」——口径诚实
- 排放路径变换：`scale ×基准` → `declineStart 前保持` → `线性降至 0 @netZeroYear` → `netZero+50 年内降至 −2 GtC/yr 并保持`（温和负排放）
- 碳汇三档 = β_land/k_ocean ×{0.85, 1, 1.15}，钳制在参数先验范围内；CH₄ 三档 = 绝对目标（低 1150 / 中 1800 / 高 3400 ppb @2100）
- 海岸防护仅作用于**城市暴露判定**（web 端）：none=0m；fixed=人口≥100 万 +2m；adaptive=人口≥500 万 +3m、其余 +1.5m
- 阈值年（1.5/2/3°C 首超）为引擎纯函数；受影响城市在 web 端计算（依赖 GeoNames）
- URL 状态：scenario/year/uncertainty/exp(base64 controls)；页面与 API 共用同一规范化

**完成判据:** 全仓测试绿 + web build 绿 + E2E 全绿（新增 lab/分享 3-4 项）+ docs/10 §6 回填。

### T1 引擎：runExperiment + 阈值年
- [ ] experiment.ts：ExperimentControls 接口 + zod 范围校验 + 路径变换函数（纯函数可单测）+ runExperiment(base, controls)（排放驱动串联，SimResult.schemaVersion 2 + experiment 字段）
- [ ] thresholds.ts：crossingYears(sim 或 records) → {1.5, 2, 3}°C 首超年份（可含未超）
- [ ] 测试：默认 controls 下 2100 ΔT 与浓度驱动基准差 < 0.5°C（口径合理性）；G7/G8 分量和在实验模式同样成立；逐位确定性；阈值年单调；zod 拒绝越界 controls

### T2 Web：URL 状态 + 实验编辑器
- [ ] lib/url-state.ts：parse/serialize（scenario/year/uncertainty/exp）↔ query；页面挂载读取、变化时 replaceState
- [ ] components/ExperimentEditor.tsx：7 控制项（滑杆×3 + 三档分段按钮×3 + 防护下拉）、实验名/备注、恢复默认、保存到 localStorage（最多 5 个，环形覆盖）
- [ ] page 接线：exp 状态 → useExperiment（复用 worker 路径，experiment 分支）；编辑器在抽屉新 tab「实验室」

### T3 Web：对比视图 + 时间轴标记
- [ ] components/ComparePanel.tsx：A（当前，可实验）/B（任一 SSP）双曲线叠加 + delta 卡片（至 2100/2500 少升温/少 SLR/累计排放差）+ 阈值年对照表 + 受影响城市（数量 + 最早 5 个，含防护档）
- [ ] Timeline 关键年份刻度 2030/2050/2100/2200/2500
- [ ] 组件测试

### T4 分享与导出 + /embed
- [ ] 「分享」按钮：复制链接（canonicalUrl）+ 导出 CSV（年度序列）+ 导出 PNG 分享卡片（webgl canvas 快照 + 指标文字合成离屏 canvas）
- [ ] app/embed/page.tsx：无编辑器视图（复用 Dashboard，抽离 components/Dashboard.tsx）
- [ ] API：/api/simulate 支持 exp 参数 + 返回 canonicalUrl 与实验摘要（controls 回显 + 2100/2500 摘要）

### T5 E2E + 回填收尾
- [ ] E2E：编辑器改滑杆 → 指标变化；对比 tab 显示阈值年；分享链接可复制；/embed 可载入
- [ ] modelVersion 0.3.0；docs/10 §6 回填；全仓验证 + 提交
