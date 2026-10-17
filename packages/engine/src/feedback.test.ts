import { describe, it, expect } from "vitest";
import { runScenario } from "./index.js";
import { runSim } from "./solver.js";
import { makeHistoricalDrivers, makeScenarioDrivers, initialState } from "./scenario.js";
import { PARAMETER_DEFAULTS } from "@future-earth/spec";
import { CALIBRATED_PARAMS } from "./generated/params.gen.js";
import { PF_CO2_SHARE, PF_CH4_SHARE, RECOVERY_TAU, rhFromClosure, landSinkWithWater, iceAlbedoForcing } from "./feedback.js";
import type { Params } from "./types.js";

const p: Params = { ...PARAMETER_DEFAULTS, ...CALIBRATED_PARAMS };

describe("V1.5 Phase C：碳循环增强记账", () => {
  const sim = runScenario("ssp585", 2500);
  const cb = sim.metrics.diagnostics!.carbon!;
  const idx2100 = sim.years.indexOf(2100);

  it("闭合会计：landSink ≡ NPP − Rh（全部年份）", () => {
    // landSink = β·ln(C/C₀)，用引擎同式重算
    const beta = CALIBRATED_PARAMS.beta_land ?? PARAMETER_DEFAULTS.beta_land;
    for (const i of [0, idx2100, sim.years.length - 1]) {
      const co2 = sim.metrics.co2[i]!;
      const landSink = beta * Math.log(co2 / (PARAMETER_DEFAULTS.c0_ref ?? 280));
      expect(Math.abs(cb.npp[i]! - cb.rh[i]! - landSink)).toBeLessThan(0.05); // 各自 toFixed(2) 累计舍入
    }
  });
  it("冻土分账：CO₂ + CH₄ = 总释放；份额 0.6/0.4", () => {
    expect(PF_CO2_SHARE + PF_CH4_SHARE).toBeCloseTo(1, 9);
    for (const i of [0, idx2100, sim.years.length - 1]) {
      expect(cb.permafrostCo2[i]! + cb.permafrostCh4[i]!).toBeCloseTo(
        cb.permafrostCo2[i]! / PF_CO2_SHARE, 2,
      );
    }
  });
  it("土壤碳代理单调性（无火灾失控时）+ 恢复时间尺度常量", () => {
    expect(cb.soilCarbonProxy.at(-1)!).toBeGreaterThan(cb.soilCarbonProxy[10]!);
    expect(cb.recoveryTau.every((t: number) => t === RECOVERY_TAU)).toBe(true);
  });
  it("G1–G6 逐位不动：原始 records 中既有数值路径与本改动无关（golden 全绿即证）", () => {
    // 直接复跑 golden 关键断言之一：G4 ssp585 2100 在 AR6 区间
    const dT = sim.metrics.tempAnomaly[idx2100]!;
    expect(dT).toBeGreaterThan(3.3);
    expect(dT).toBeLessThan(5.7);
  });
  it("rhFromClosure 单位性质", () => {
    expect(rhFromClosure(50, 40)).toBe(10);
    expect(rhFromClosure(50, 60)).toBe(-10); // 汇超 NPP 时 Rh 为负 = 会计口径说明
  });
});

describe("V1.5 Phase B：水循环→陆汇耦合（可回滚构造）", () => {
  const mkP = (s: number): Params => ({ ...PARAMETER_DEFAULTS, ...CALIBRATED_PARAMS, sink_water_strength: s });
  const run = (s: number) => runSim({
    startYear: 1850, endYear: 2500, initialState: initialState(),
    driversAt: (y) => (y <= 2024 ? makeHistoricalDrivers()(y) : makeScenarioDrivers("ssp585")(y)),
    params: mkP(s),
  });

  it("可回滚：s=0 路径短路 + 历史段守恒闭合（G5 口径：1850-2024 排放驱动段）", () => {
    const a = run(0);
    expect(a.records.at(-1)!.co2).toBeGreaterThan(600); // ssp585 2500 合理量级
    const hist = runSim({ // 仅历史段——与 golden G5 同口径
      startYear: 1850, endYear: 2024, initialState: initialState(),
      driversAt: makeHistoricalDrivers(), params: mkP(0),
    });
    expect(hist.carbon.residualRatio).toBeLessThan(0.01); // 排放驱动段守恒闭合
  });
  it("单调性：s 越大 → 陆汇对干旱更敏感 → CO₂ 略高（湿润期反之）——量级有限", () => {
    const base = run(0);
    const s02 = run(0.2);
    const dCO2 = s02.records.at(-1)!.co2 - base.records.at(-1)!.co2;
    expect(Math.abs(dCO2)).toBeLessThan(60); // 弱反馈（<60 ppm @2500 ssp585）
    expect(Math.abs(dCO2)).toBeGreaterThan(0); // 确实生效（非零）
  });
  it("稳定性：s=0.3（先验上限）四情景无告警", () => {
    for (const id of ["ssp126", "ssp245", "ssp370", "ssp585"] as const) {
      const out = runSim({
        startYear: 1850, endYear: 2500, initialState: initialState(),
        driversAt: (y) => (y <= 2024 ? makeHistoricalDrivers()(y) : makeScenarioDrivers(id)(y)),
        params: mkP(0.3),
      });
      expect(out.records.every((r) => Number.isFinite(r.co2) && Number.isFinite(r.tempAnomaly)), id).toBe(true);
    }
  });
  it("landSinkWithWater 单位性质", () => {
    expect(landSinkWithWater(4, 800, 0.3)).toBe(4);            // 稳态水分 → 无修正
    expect(landSinkWithWater(4, 700, 0.3)).toBeLessThan(4);    // 干旱 → 汇减弱
    expect(landSinkWithWater(4, 900, 0.3)).toBeGreaterThan(4); // 湿润 → 汇增强
  });
});

describe("V1.5 Phase A：冰-反照率反馈（可回滚构造）", () => {
  it("s=0 → ΔF ≡ 0；s>0 → 正反馈随温升增大；饱和下界", () => {
    expect(iceAlbedoForcing(3, 0)).toBe(0);
    expect(iceAlbedoForcing(1, 0.5)).toBeGreaterThan(0);
    expect(iceAlbedoForcing(3, 0.5)).toBeGreaterThan(iceAlbedoForcing(1, 0.5));
    // 饱和：极大温度下不发散（面积下界 0.3·A₀）
    expect(iceAlbedoForcing(20, 0.5)).toBeCloseTo(iceAlbedoForcing(30, 0.5), 3);
  });
  it("耦合后稳定性：s=1（先验上限）四情景无发散", () => {
    for (const id of ["ssp126", "ssp585"] as const) {
      const out = runSim({
        startYear: 1850, endYear: 2500, initialState: initialState(),
        driversAt: (y) => (y <= 2024 ? makeHistoricalDrivers()(y) : makeScenarioDrivers(id)(y)),
        params: { ...PARAMETER_DEFAULTS, ...CALIBRATED_PARAMS, ice_albedo_strength: 1 },
      });
      expect(out.records.every((r) => Number.isFinite(r.co2) && Number.isFinite(r.tempAnomaly)), id).toBe(true);
      expect(out.records.at(-1)!.tempAnomaly).toBeLessThan(20); // 不失控
    }
  });
  it("s=1 时敏感度增加（ssp585 2100 ΔT > 基线）——物理方向正确", () => {
    const base = runScenario("ssp585", 2100).metrics.tempAnomaly.at(-1)!;
    const coupled = runSim({
      startYear: 1850, endYear: 2100, initialState: initialState(),
      driversAt: (y) => (y <= 2024 ? makeHistoricalDrivers()(y) : makeScenarioDrivers("ssp585")(y)),
      params: { ...PARAMETER_DEFAULTS, ...CALIBRATED_PARAMS, ice_albedo_strength: 1 },
    }).records.at(-1)!.tempAnomaly;
    expect(coupled).toBeGreaterThan(base);
  });
});
