# 未来地球引擎 v0.2 — 可信度与可解释性实现计划

> **For agentic workers:** 按 superpowers:executing-plans 逐任务执行。步骤用 `- [ ]` 跟踪。

**Goal:** 落地 docs/10 §5 全部任务（V02-M01~M06、V02-E01~E05、Web 图表/面板组）与验收门 G0/G7/G8/G9/UX-01/02，不破坏 G1–G6。

**基线:** v0.1.0，176 测试全绿。**版本号升至 0.2.0，schemaVersion 升至 2。**

**关键设计决策：**
- 模型状态分类（M01）以**新增 `status` 字段**实现（coupled/diagnostic/prescribed/planned），不改动既有 `impl` 分级语义——两轴正交：impl=版本批次，status=运行时角色
- 驱动模式（M02）统一标记为 `hybrid`（1850–2024 排放驱动 + 2025 起浓度驱动），写入 SimResult.metadata
- 海平面贡献链（E02）在 Web 端由分量数组差分导出（增量为纯派生量，不进引擎契约）
- 图表全部自绘 SVG（零新依赖），复用 Colorbar/colormap 视觉语言
- G7 门：逐年 |F_CO2+F_CH4+F_N2O+F_other − F_total| < 1e-9（同源计算，防未来改动破坏分解）

---

### T1 规格治理（M01 + M04）
- [ ] schema.ts：VariableSchema/EquationSchema 增 `status: z.enum(["coupled","diagnostic","prescribed","planned"])`（带 default "planned" 以便分批补标）
- [ ] variables.yaml（58 条）+ equations.yaml（53 条）补 status：coupled=solver 状态量及其定义方程（co2/ts/td/海平面分量/生物量/土壤水/冻土箱）；diagnostic=已注册的诊断式（energy/water/seaice/bio/fire/geo 等）；prescribed=浓度/强迫外生输入；planned=未实现
- [ ] datasets.yaml 路径修正：sea_level 条目转 stage v0.3（未落盘）、dem→elevation_5min.png、cities→cities_top500.csv、baseline_climate→precip_5min.png（语义改为降水基准）；补 static 两条实际文件
- [ ] manifest 测试增加「spec datasets path(stage 落盘者) 必须存在于 manifest」校验
- [ ] gen:spec 重生成 + 一致性测试过 — **验收：全测试绿**

### T2 契约扩展（M02 + M06 + M05）
- [ ] types.ts：SimResult → schemaVersion: 2 + `metadata: { modelScope: "global-box"; driverMode: "hybrid"; driverSegments: [{from,to,mode}][]; confidenceNotes: [{from,to?,label}][]; dataManifestHash: string }`
- [ ] data 包导出 `manifestHash()`（sha256 of canonical manifest entries）
- [ ] index.ts runScenario 填充 metadata；confidenceNotes: 2025–2100「AR6 校准区间」/ 2101–「探索性外推」
- [ ] API/worker/客户端兼容 schema 2（web lib/sim.ts 类型跟随）
- [ ] 测试：metadata 完整性 + G9（同 fingerprint+manifest+scenario 两次运行逐位一致）— **验收：G9 测试绿**

### T3 诊断统一（E01 + E02 基础 + E04）
- [ ] YearRecord 增：forcingCo2/forcingCh4/forcingN2o/forcingOther、oceanHeatUptake(=γ(ts−td))、seaIceArea、precip/evap/runoff（water.ts 诊断）、npp/fireAnomaly
- [ ] solver 逐年填充（复用 equations/ 各纯函数，不重复公式）
- [ ] SimResult.metrics.diagnostics: { forcing: {co2,ch4,n2o,other,total}[], oceanHeatUptake[], seaIceArea[], water:{precip,evap,runoff}[], bio:{npp,fireAnomaly}[] }
- [ ] G7 测试（分量和=总强迫逐年）；G8 测试（海平面分量和=total 逐年）
- [ ] golden G1–G6 逐位不被破坏（记录字段追加不改变既有数值路径）— **验收：G7/G8 新测试绿 + golden 原绿**

### T4 反馈闭合与稳定性（E03 + E05）
- [ ] `reportCarbonClosure(sim)`：历史段（排放驱动）守恒残差 + 情景段标注「CO₂ 外生输入，碳汇为诊断量」
- [ ] `checkStability(records): string[]`：NaN/Inf、co2∈(150,10000)、|dTemp|<0.5K/yr、permafrost≥0、glacier≤G0+ε、seaLevel 分量非负；正常四情景跑无告警
- [ ] SimResult 增 `warnings: string[]`（正常为空数组）+ 测试（正常无告警、构造异常态有告警）— **验收：测试绿**

### T5 校准报告（M03）
- [ ] scripts/gen-report.ts：跑历史+四情景 → docs/superpowers/reports/calibration-report.md（G1–G6 数值、2100 vs AR6 表、参数指纹、manifest hash、生成日期）
- [ ] package.json `report` 脚本 + CI 追加该步骤（ci.yml）
- [ ] 测试：报告文件生成且含关键节标题 — **验收：node 脚本产出报告**

### T6 Web 可信度 UI
- [ ] components/Chart.tsx：通用 SVG 折线（多序列/带宽阴影/缩放范围 props）——所有图表的底座
- [ ] ObsCompare.tsx：模型 vs GISTEMP 观测（1880–2024，web 端从 datasets.gen TEMPERATURE 取观测）
- [ ] SlrStacked.tsx：海平面四分量堆叠面积
- [ ] TimeSeriesPanel.tsx：温度/CO₂/海平面/冻土/植被 tab + MC p10–p90 阴影（worker MC 输出）
- [ ] MetadataPanel.tsx（结果说明：单位/来源/层级/置信）+ ContributionPanel.tsx（为什么会这样：当前年强迫分解条形 + 海平面分量占比）
- [ ] Timeline/MetricsBar 加 2100 后「探索性外推」标签；MetricsBar 窄屏横向滚动
- [ ] page.tsx 组装为可折叠右栏/底栏；vitest 组件测试（渲染 + 关键数据到位）
- [ ] E2E：UX-01（30 秒内可见 年份+情景+三指标）、UX-02（单页可见 2024/2100/2500 读数）— **验收：组件测试 + 2 个 E2E 绿**

### T7 收尾
- [ ] modelVersion 0.2.0；docs/10 §5 勾选回填；README 更新
- [ ] 全仓验证：pnpm test（含新 G7/G8/G9）+ web build + E2E
- [ ] 提交
