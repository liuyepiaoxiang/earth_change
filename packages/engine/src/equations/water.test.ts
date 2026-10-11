import { describe, it, expect } from "vitest";
import {
  precipitation,
  evaporation,
  runoff,
  waterBalanceStep,
  soilWaterStep,
  snowStep,
} from "./water.js";

describe("eq_19–24 水循环诊断链（v1.x 收尾批）", () => {
  it("eq_19 降水：基准 840mm、每 °C +2%", () => {
    expect(precipitation(0)).toBeCloseTo(840, 6);
    expect(precipitation(2)).toBeCloseTo(840 * 1.04, 6);
  });

  it("eq_20 蒸发：基准 500mm、Clausius 6%/°C、极冷趋近 0", () => {
    expect(evaporation(0)).toBeCloseTo(500, 6);
    expect(evaporation(1)).toBeCloseTo(530, 6);
    expect(evaporation(-10)).toBeCloseTo(200, 6); // 500×(1−0.6)
    expect(evaporation(-17)).toBe(0); // 钳制
  });

  it("eq_22 径流：有效输入超容量才产生，干旱期 0", () => {
    expect(runoff(1000, 900, 500)).toBe(0); // 400 < 剩余容量 500
    expect(runoff(1200, 900, 500)).toBe(100); // 400 − 剩余 300 = 100
    expect(runoff(1400, 400, 500)).toBe(0); // 干旱期
  });

  it("eq_21/23 水量平衡：干旱持续 → 土壤水归 0；丰水持续 → 容量满", () => {
    let w = 800;
    for (let i = 0; i < 20; i++) w = waterBalanceStep(w, 300, 500); // P<E 持续干旱
    expect(w).toBe(0);
    for (let i = 0; i < 30; i++) w = waterBalanceStep(w, 2000, 500); // 持续丰水
    expect(w).toBe(1500);
    expect(soilWaterStep(800, 840, 500)).toBe(waterBalanceStep(800, 840, 500));
  });

  it("水量守恒：ΔW = P − E − R（一步恒等式）", () => {
    const w0 = 800;
    const p = 1200;
    const e = 500;
    const w1 = waterBalanceStep(w0, p, e);
    const r = runoff(w0, p, e);
    expect(w1 - w0).toBeCloseTo(p - e - r, 6);
  });

  it("eq_24 积雪：冰点下降水全为雪、正温度按度日融化、非负钳制", () => {
    expect(snowStep(100, 840, -5)).toBe(940); // T<0：无融化，雪 +840
    expect(snowStep(100, 840, 2)).toBe(0); // 融化 2°C×180 = 360 > 库存 100 → 钳 0
    expect(snowStep(500, 840, 2)).toBe(140); // 500 − 360 = 140
    expect(snowStep(10, 840, 10)).toBe(0); // 融化 1800 ≫ 库存
  });
});
