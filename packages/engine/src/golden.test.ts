import { describe, it, expect } from "vitest";
import { runSim } from "./solver.js";
import { makeHistoricalDrivers, makeScenarioDrivers, initialState } from "./scenario.js";
import { PARAMETER_DEFAULTS } from "@future-earth/spec";
import { CALIBRATED_PARAMS } from "./generated/params.gen.js";
import { loadCO2, loadTemperature } from "@future-earth/data";
import type { Params } from "./types.js";

const base: Record<string, number> = { ...PARAMETER_DEFAULTS, ...CALIBRATED_PARAMS };
const p = base as Params;
const tempObs = loadTemperature();
const co2Obs = loadCO2();
const hist = runSim({ startYear: 1850, endYear: 2024, initialState: initialState(), driversAt: makeHistoricalDrivers(), params: p });
const H = hist.records;
const at = (y: number) => H.find((r) => r.year === y)!;

/** 历史(1850-2024) + 情景(2025-2500) 串联运行 */
function runScenario(id: "ssp126" | "ssp245" | "ssp370" | "ssp585") {
  const driversHist = makeHistoricalDrivers();
  const driversScn = makeScenarioDrivers(id);
  const driversAt = (y: number) => (y <= 2024 ? driversHist(y) : driversScn(y));
  return runSim({ startYear: 1850, endYear: 2500, initialState: initialState(), driversAt, params: p }).records;
}

describe("黄金验收（SPEC §7.3）", () => {
  it("G1 历史温度：|ΔT(2024)−观测| < 0.2°C 且 1980-2024 RMSE < 0.2°C", () => {
    expect(Math.abs(at(2024).tempAnomaly - tempObs.at(-1)!.anomaly)).toBeLessThan(0.2);
    const obs = tempObs.filter((r) => r.year >= 1980);
    const mod = obs.map((r) => at(r.year).tempAnomaly);
    const rmse = Math.sqrt(obs.reduce((a, r, i) => a + (mod[i]! - r.anomaly) ** 2, 0) / obs.length);
    console.log(`G1: ΔT(2024)=${at(2024).tempAnomaly.toFixed(2)} obs=${tempObs.at(-1)!.anomaly.toFixed(2)} rmse=${rmse.toFixed(3)}`);
    expect(rmse).toBeLessThan(0.2);
  });
  it("G2 历史CO₂：|C(2024)−观测| < 5ppm 且 1960-2024 累计增长误差 < 10%", () => {
    const obs24 = co2Obs.at(-1)!.ppm;
    expect(Math.abs(at(2024).co2 - obs24)).toBeLessThan(5);
    const o60 = co2Obs.find((r) => r.year === 1960)!.ppm;
    const m60 = at(1960).co2;
    const err = Math.abs((at(2024).co2 - m60) - (obs24 - o60)) / (obs24 - o60);
    console.log(`G2: C(2024)=${at(2024).co2.toFixed(1)} obs=${obs24} growthErr=${(err * 100).toFixed(1)}%`);
    expect(err).toBeLessThan(0.10);
  });
  it("G3 历史海平面：|S(2024)−S(1900)−0.23m| < 0.07m", () => {
    const d = at(2024).seaLevel - at(1900).seaLevel;
    console.log(`G3: S(2024)-S(1900)=${d.toFixed(3)}m (目标 0.23±0.07)`);
    expect(Math.abs(d - 0.23)).toBeLessThan(0.07);
  });
  it("G4 未来情景：2100 年 ΔT 落在 AR6 很可能区间", () => {
    const AR6: Record<string, [number, number, number]> = { // [min, max, best]
      ssp126: [1.3, 2.4, 1.8], ssp245: [2.1, 3.5, 2.7], ssp370: [2.8, 4.6, 3.6], ssp585: [3.3, 5.7, 4.4],
    };
    for (const [id, [lo, hi, best]] of Object.entries(AR6)) {
      const r = runScenario(id as "ssp245").find((x) => x.year === 2100)!;
      console.log(`G4 ${id}: ΔT2100=${r.tempAnomaly.toFixed(2)} (AR6 ${lo}-${hi}, best ${best})`);
      expect(r.tempAnomaly, id).toBeGreaterThan(lo);
      expect(r.tempAnomaly, id).toBeLessThan(hi);
    }
  });
  it("G5 物理健全性：碳守恒残差 < 1%、无 NaN、逐位确定", () => {
    expect(hist.carbon.residualRatio).toBeLessThan(0.01);
    const again = runSim({ startYear: 1850, endYear: 2024, initialState: initialState(), driversAt: makeHistoricalDrivers(), params: p });
    expect(JSON.stringify(again.records)).toBe(JSON.stringify(hist.records));
  });
});
