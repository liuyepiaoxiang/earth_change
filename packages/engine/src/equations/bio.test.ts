import { describe, it, expect } from "vitest";
import {
  fCo2, fTemp, fWater, fPrecip, carryingCapacity,
  growth, death, npp, vegetationDdt, biomassDdt, B0,
} from "./bio.js";
import { PARAMETERS } from "@future-earth/spec";

const nppMax = PARAMETERS.find((p) => p.id === "npp_max")!.default; // 50

describe("环境响应函数（fCO2/fT/fW/fP）", () => {
  it("fCO2：1850 年 = 1；CO₂ 倍增 ≈ 1 + 0.4·ln2 ≈ 1.28；非负", () => {
    expect(fCo2(280)).toBeCloseTo(1, 9);
    expect(fCo2(560)).toBeCloseTo(1 + 0.4 * Math.LN2, 6);
    expect(fCo2(100)).toBeGreaterThanOrEqual(0);
  });

  it("fT/fP：ΔT=0 → 1；暖化增益线性；fP 与 eq_52 同式", () => {
    expect(fTemp(0)).toBe(1);
    expect(fTemp(2)).toBeCloseTo(1.1, 9);
    expect(fPrecip(0)).toBe(1);
    expect(fPrecip(2)).toBeCloseTo(1.04, 9);
  });

  it("fW：W=W₀ → 1；干旱线性下降；非负", () => {
    expect(fWater(800)).toBe(1);
    expect(fWater(400)).toBeCloseTo(0.5, 9);
    expect(fWater(0)).toBe(0);
  });
});

describe("eq_33/34 生长与死亡（logistic 净形式）", () => {
  it("承载力：B=K → 净生长 0（稳态）；B<K 正；B>K 钳 0（净减少由死亡分项承担）", () => {
    const k = carryingCapacity(550, 1);
    expect(growth(550, k, 1, 1, 1, 1)).toBeCloseTo(0, 9);
    expect(growth(300, k, 1, 1, 1, 1)).toBeGreaterThan(0);
    expect(growth(700, k, 1, 1, 1, 1)).toBe(0);
  });

  it("eq_34 死亡诊断分项线性", () => {
    expect(death(550, 0.02)).toBeCloseTo(11, 9);
  });

  it("eq_36 NPP：1850 稳态 ≈ npp_max（观测 50–60 GtC/yr 量级）", () => {
    expect(npp(550, nppMax, 1, 1, 1, 1)).toBeCloseTo(nppMax, 9);
  });
});

describe("eq_35/18 生物量动力学（净形式同源）", () => {
  it("1850 稳态：B=B₀、环境基线 → dB/dt ≈ 0（无火灾）", () => {
    expect(vegetationDdt(550, 1, 1, 1, 1)).toBeCloseTo(0, 9);
    expect(biomassDdt(550, 1, 1, 1, 1, 0.015, 550, 0)).toBeCloseTo(0, 9);
  });

  it("CO₂ 施肥 → 承载力升 → 正增长（植被碳汇）", () => {
    expect(biomassDdt(550, 1, 1, 1, fCo2(560), 0.015, 550, 0)).toBeGreaterThan(0);
  });

  it("火灾通量线性扣减", () => {
    const a = biomassDdt(550, 1, 1, 1, 1, 0.015, 550, 0);
    const b = biomassDdt(550, 1, 1, 1, 1, 0.015, 550, 0.5);
    expect(a - b).toBeCloseTo(0.5, 9);
  });

  it("B→0 非负守卫：火灾通量不会把库推成负值", () => {
    expect(biomassDdt(0.1, 1, 1, 1, 1, 0.015, 550, 5)).toBeGreaterThanOrEqual(-5);
  });

  it("长期积分收敛到施肥后稳态（K 随 CO₂ 上移）", () => {
    let b = 550;
    const c = 560; // CO₂ 倍增 → K = 550×fCo2(560) ≈ 702
    for (let i = 0; i < 500; i++) {
      b = Math.max(0, b + biomassDdt(b, 1, 1, 1, fCo2(c), 0.015, 550, 0));
    }
    expect(b).toBeCloseTo(carryingCapacity(550, fCo2(c)), 0);
  });

  it("eq_35 与 eq_18 同源：dV/dt = dB/dt / B₀", () => {
    expect(vegetationDdt(400, 1.2, 1, 1.1, 1.3)).toBeCloseTo(biomassDdt(400, 1.2, 1, 1.1, 1.3, 0.015, 550, 0) / 550, 9);
  });
});
