# 未来地球引擎 v1.5 — 反馈侧升级实现计划（待执行）

> **For agentic workers:** 按 superpowers:executing-plans 逐任务执行。**本计划为下一会话准备——动态耦合 + 重校准需要完整验证预算，勿在长会话尾段执行。**

**Goal:** 落地 docs/10 §8（修正后正文）：海冰-反照率、碳循环增强、水循环反馈的有限动态耦合，保持可校准/可解释/**可回滚**。

**关键设计决策（已论证）：**
- **可回滚构造**：每个新反馈配 `strength` 参数，默认 0 = 与 v1.0 逐位一致（G1-G14 不动的基线证明）；>0 才启用耦合
- **分期落地，先低风险**：C（碳记账，纯诊断零风险）→ B（水循环→陆汇响应，弱耦合）→ A（海冰-反照率→强迫，最强耦合，必须重校准）
- 重校准后必须全量重跑 G1-G6 + 校准报告 + params.json 重锁；MC 扰动集扩展新参数

### T1（Phase C 碳循环增强记账——零耦合风险）
- [ ] 诊断分解：陆地汇 = NPP − Rh（土壤异养呼吸分开）；冻土释放 ePf 按 CO₂:CH₄ = 0.6:0.4 分账（文献份额）；火灾通量与植被恢复时间尺度分开记录
- [ ] YearRecord/SimResult.diagnostics.carbon: { npp, rh, soilCarbonProxy, permafrostCo2, permafrostCh4, fireF, recoveryTau }
- [ ] 测试：分量和 == 既有总量（landSink = npp − rh）；G1-G6 逐位不动（strength 默认 0 证明）

### T2（Phase B 水循环→陆汇弱耦合）
- [ ] 参数 `sink_water_strength`（默认 0，先验 0-0.3）：landSink × f(w)，f = 1 + s·(w − 800)/800
- [ ] rhs 接入（v2Fluxes 内）；s=0 逐位一致测试；s=0.2 时 G1-G4 复跑并微调校准
- [ ] 重校准 + params.json + 校准报告 + G1-G6 全绿

### T3（Phase A 海冰-反照率网格反馈）
- [ ] 网格海冰面积（复用 gridSeaIceFraction 加权聚合为全球量 A_i(t)）；四类反照率（雪/裸地/海水/海冰）参数化
- [ ] 参数 `ice_albedo_strength`（默认 0）+ 饱和边界（A_i 下限 0.3×A₀）：ΔF_albedo = −s·(α_i A_i + ... − 基线)·S₀/4 进入 fOther 侧
- [ ] rhs 接入 + 重校准 + AR6 复核（冰反照率会推高敏感度——λ 先验范围可能需要收窄）
- [ ] Web：诊断面板显示「反馈贡献分解」（新增 albedo 项）

### T4 收尾
- [ ] MC 扰动集扩展（新 strength 参数入 PERTURBED_IDS）；G6 扩展（反馈强度范围健全性）；modelVersion 1.5.0；docs/10 §8 回填
