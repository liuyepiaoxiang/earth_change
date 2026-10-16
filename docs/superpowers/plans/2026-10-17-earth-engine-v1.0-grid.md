# 未来地球引擎 v1.0 — 区域化气候场实现计划

> **For agentic workers:** 按 superpowers:executing-plans 逐任务执行。

**Goal:** 从「全球平均 + 城市点」升级为 2.5° 规则网格气候场：温度/降水/蒸发/土壤水/径流/积雪/植被适宜度/海冰，可浏览、采样、框选统计，通过 G10–G14。版本号 1.0.0。

**关键设计决策：**
- **派生式网格场**：场 = 基准气候网格（静态）+ 全球 SimResult 的模式缩放（动态），任意年份毫秒级重建——无预计算时空立方体，时间轴拖动零成本（PERF-03）
- 分辨率 2.5°（144×72=10368 格），支持聚合到 5° 供 G12 收敛检验
- 放大场 amp(lat, landfrac)（极地放大 + 陆地增强 ×1.3/海洋 ×0.9），**面积+陆海加权归一化**使全球均值恒等于 0D 核心（G10 构造性成立）
- 逐格水循环为**按需桶模型**（查询年 → 该格 1850→t 积分，Worker 执行 + 年份缓存）；积雪/海冰/植被适宜度为逐年瞬时诊断式
- 基准数据：WorldClim tavg/prec（下载聚合）+ elevation_5min.png（解码聚合）→ datasets.gen 固化 GRID 常量

**完成判据:** 全仓测试绿 + build 绿 + E2E 绿（新增网格 2-3 项）+ G10–G14 自动化 + docs/10 §7 回填。

### T1 基准气候网格（V10-D01/D02）
- [ ] scripts/gen-grid.mjs：WorldClim 10m tavg/prec 下载解压（复用 fetch-static 管线）+ pngjs 解码 elevation_5min.png → 聚合到 2.5°：T0(0.1°C)/P0(0mm)/elev(m)/landfrac(0-1)
- [ ] gen-bundle 增 GRID 常量（4×10368 数组）+ manifest；landmask 亦导出（landfrac>0.5）
- [ ] 测试：格点数、T0 全球面积加权均值 ∈[5,20]°C、P0 ∈[800,1200]mm、 Sahara/极地/赤道边界值健全（G13 数据侧）

### T2 引擎网格模块（V10-E01~E04）
- [ ] grid.ts：GridField 接口 + ampField 归一化 + temperatureField/precipField + 桶模型 cellWaterTimeline(lat,lon 或 cell)→P/E/W/R 序列 + snow/seaIce/vegSuit 诊断 + sampleGrid/regionStats(bbox, 面积加权 mean/min/max/p10/p90)
- [ ] G10：温度场 2024/2100/2500 全球加权均值 vs 0D ΔT 差 < 0.01°C（构造性）
- [ ] G11：格点年水量守恒（ΔW = P−E−R±雪）残差 < 1e-9
- [ ] G12：2.5° vs 聚合 5° 全球加权 ΔT 差 < 0.01
- [ ] G13：撒哈拉 P<250、赤道 P>1500、极地 T<−20 等边界断言
- [ ] G14：场序列化 checksum 确定性
- [ ] 导出 runGridFields(sim, year)（Worker 消费）

### T3 Web 网格层与区域统计（V10-E05 + §7.4）
- [ ] worker：gridFields 消息（年份缓存 Map，容量上限 LRU 64 年）
- [ ] GlobeView：温度场层升级为 2.5° 格点着色（替换纬度带点云）；新增「降水场」层；图例/单位/来源（VIS-01）
- [ ] 框选：两次点击设定对角 → regionStats 面板（均值/极值/分位 + 格点数）+ 点采样（点击非城市格显示格点值）
- [ ] LayerControl：网格层开关接线；城市点保留（降级为采样点）
- [ ] 组件测试 + PERF 冒烟（拖动期间无长任务断言——e2e 粗测）

### T4 收尾
- [ ] E2E：网格层渲染/框选统计/点采样 2-3 项；modelVersion 1.0.0；docs/10 §7 回填；全仓验证
