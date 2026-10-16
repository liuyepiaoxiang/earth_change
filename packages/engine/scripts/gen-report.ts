/** 用法：npx tsx packages/engine/scripts/gen-report.ts（pnpm report）
 *  V02-M03 校准报告：G1-G4 数值 + 2100 情景 vs AR6 + 参数指纹 + 数据指纹 → docs/superpowers/reports/calibration-report.md */
import { writeFileSync, mkdirSync } from "node:fs";
import { runSim } from "../src/solver.js";
import { makeHistoricalDrivers, makeScenarioDrivers, initialState } from "../src/scenario.js";
import { runScenario } from "../src/index.js";
import { reportCarbonClosure } from "../src/closure.js";
import { PARAMETER_DEFAULTS, type ScenarioId } from "@future-earth/spec";
import { loadTemperature, loadCO2, manifestHash } from "@future-earth/data";
import { CALIBRATED_PARAMS, PARAMS_FINGERPRINT } from "../src/generated/params.gen.js";
import type { Params, YearRecord } from "../src/types.js";

const p: Params = { ...PARAMETER_DEFAULTS, ...CALIBRATED_PARAMS };
const tempObs = loadTemperature();
const co2Obs = loadCO2();

const hist = runSim({ startYear: 1850, endYear: 2024, initialState: initialState(), driversAt: makeHistoricalDrivers(), params: p });
const H = hist.records;
const at = (y: number) => H.find((r) => r.year === y)!;
const rmse = (xs: number[], ys: number[]) => Math.sqrt(xs.reduce((a, x, i) => a + (x - ys[i]!) ** 2, 0) / xs.length);

const obsTemp = tempObs.filter((r) => r.year >= 1980);
const modTemp = obsTemp.map((r) => at(r.year).tempAnomaly);
const g1Endpoint = Math.abs(at(2024).tempAnomaly - tempObs.at(-1)!.anomaly);
const g1Rmse = rmse(modTemp, obsTemp.map((r) => r.anomaly));

const obs24 = co2Obs.at(-1)!.ppm;
const o60 = co2Obs.find((r) => r.year === 1960)!.ppm;
const g2Endpoint = Math.abs(at(2024).co2 - obs24);
const g2Growth = Math.abs((at(2024).co2 - at(1960).co2) - (obs24 - o60)) / (obs24 - o60);
const g3 = at(2024).seaLevel - at(1900).seaLevel;

const AR6: Record<string, [number, number, number]> = { ssp126: [1.3, 2.4, 1.8], ssp245: [2.1, 3.5, 2.7], ssp370: [2.8, 4.6, 3.6], ssp585: [3.3, 5.7, 4.4] };
const rows: string[] = [];
for (const id of Object.keys(AR6) as ScenarioId[]) {
  const sim = runScenario(id, 2100);
  const i = sim.years.indexOf(2100);
  const dT = sim.metrics.tempAnomaly[i]!;
  const slr = sim.metrics.seaLevel.total[i]!;
  const [lo, hi, best] = AR6[id]!;
  const pass = dT > lo && dT < hi ? "✅" : "❌";
  rows.push(`| ${id} | ${dT.toFixed(2)} | ${lo}–${hi} | ${best} | ${pass} | ${slr.toFixed(2)} |`);
}
const closure = reportCarbonClosure("ssp245");

const md = `# 校准与验收报告

> 自动生成：pnpm report（V02-M03）——请勿手改；CI 归档产物。
> 生成日期：${new Date().toISOString().slice(0, 10)} | 模型版本：${runScenario("ssp245", 2100).modelVersion}

## 指纹（可复现性凭据）

| 项 | 值 |
|---|---|
| 参数指纹 | ${PARAMS_FINGERPRINT} |
| 数据基线指纹 | ${manifestHash()} |
| 驱动模式 | hybrid（1850-2024 排放驱动 + 2025 起浓度驱动） |

## 历史复现（1850-2024，G1-G3）

| 门 | 指标 | 数值 | 阈值 | 判定 |
|---|---|---|---|---|
| G1 | 2024 温度端点偏差 | ${g1Endpoint.toFixed(3)} °C | < 0.2 | ${g1Endpoint < 0.2 ? "✅" : "❌"} |
| G1 | 1980-2024 温度 RMSE | ${g1Rmse.toFixed(3)} °C | < 0.2 | ${g1Rmse < 0.2 ? "✅" : "❌"} |
| G2 | 2024 CO₂ 端点偏差 | ${g2Endpoint.toFixed(2)} ppm | < 5 | ${g2Endpoint < 5 ? "✅" : "❌"} |
| G2 | 1960-2024 增长误差 | ${(g2Growth * 100).toFixed(1)} % | < 10 | ${g2Growth < 0.1 ? "✅" : "❌"} |
| G3 | 1900→2024 海平面上升 | ${g3.toFixed(3)} m | 0.23 ± 0.07 | ${Math.abs(g3 - 0.23) < 0.07 ? "✅" : "❌"} |

观测基准：GISTEMP v4（温度，1880 起）、NOAA GML + 冰芯（CO₂）。

## 未来情景（2100，G4）

| 情景 | 模型 ΔT (°C) | AR6 很可能区间 | AR6 最佳估计 | 判定 | 模型 SLR (m) |
|---|---|---|---|---|---|
${rows.join("\n")}

## 碳闭合（V02-E03）

- 排放驱动段（1850-2024）：排放 ${closure.historical.cumEmissions} + 反馈 ${closure.historical.cumFeedback} GtC ≈ 大气 ${closure.historical.cumAtmos} + 陆汇 ${closure.historical.cumLand} + 海汇 ${closure.historical.cumOcean} GtC，残差比 ${closure.historical.residualRatio}（${closure.historical.closed ? "闭合 ✅" : "未闭合 ❌"}）
- ${closure.scenarioNote}
`;

const out = new URL("../../../docs/superpowers/reports/calibration-report.md", import.meta.url);
mkdirSync(new URL("../../../docs/superpowers/reports/", import.meta.url), { recursive: true });
writeFileSync(out, md, "utf8");
console.log(`报告已生成: docs/superpowers/reports/calibration-report.md（G1端点=${g1Endpoint.toFixed(3)} G4=${rows.length} 情景）`);
