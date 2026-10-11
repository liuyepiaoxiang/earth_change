# ADR-002：V1-03 的 WASM 编译移植评估为不适用，以 Web Worker 化交付收口

| 项目 | 内容 |
|---|---|
| 状态 | accepted |
| 日期 | 2026-10-11 |
| 决策人 | earth-change（单人项目，AI 起草） |
| 背景 | V1-03 原文「WASM/Web Worker 化：引擎移植」。Worker 化已交付（`lib/engine.worker.ts`，MC 等重计算移出主线程，动态 import 自动回退）。WASM 部分（TS→AssemblyScript/Rust 重写引擎）需要评估是否继续 |

## 评估

| 维度 | 分析 |
|---|---|
| 性能收益 | 引擎单次模拟毫秒级（`runScenario` ~5ms、`runScenarioMc` n=100 ~1s 且已移入 Worker 不阻塞主线程）；WASM 对此类数值循环的加速对端到端体验无可感知差异 |
| 成本 | 引擎需用 AssemblyScript/Rust 重写并维护双实现；现有 69 条引擎测试需跨运行时复刻；校准回路（Nelder-Mead）确定性对齐成本高 |
| 风险 | 双实现漂移直接威胁 G1–G5「逐位一致」门禁的语义 |

## 决策

**WASM 编译移植不做**（不适用）：Worker 化已消除全部主线程阻塞痛点，WASM 无可感知收益且成本/风险显著。V1-03 以 Worker 化交付收口。若未来出现「模拟规模扩大到 WASM 必要」（如 v2 格点状态向量），以新 ADR 重开。

## 影响

- 任务清单：V1-03 关闭（Worker 部分 ✅ + 本 ADR 收口）
- 后续 v2 若引入 2D 状态向量导致模拟变慢，优先考虑增量计算/Web Worker 并行化，而非 WASM
