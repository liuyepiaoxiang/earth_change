import { describe, it, expect } from "vitest";
import { PARAMETER_DEFAULTS } from "@future-earth/spec";
import { CALIBRATED_PARAMS } from "./generated/params.gen.js";
import type { Params } from "./types.js";
import * as forcing from "./equations/forcing.js";
import { forcingBreakdown } from "./equations/forcing-components.js";

const p: Params = { ...PARAMETER_DEFAULTS, ...CALIBRATED_PARAMS };

/** 典型状态点：工业化前 / 2019 观测（AR6 锚点）/ SSP5-8.5 2100 量级 / 未来 CH₄ 减排路径 */
const STATES: Array<[string, number, number, number, number]> = [
  ["1850 工业化前", 280, 722, 273, 0],
  ["2019 观测（AR6 锚点）", 409.8, 1866, 332, -1.2],
  ["SSP5-8.5 2100 量级", 1130, 3750, 500, -1.6],
  ["CH₄ 低于工业化前（强减排延伸）", 350, 600, 280, -1.0],
];

describe("强迫分量九分项分解（v4 诊断式，ADR-001 + G7 闭合门）", () => {
  it("闭合恒等式：Σ 九分量 === F_total（多状态点，1e-9）", () => {
    for (const [label, co2, ch4, n2o, fOther] of STATES) {
      const b = forcingBreakdown(co2, ch4, n2o, fOther, forcing.fCH4(ch4, p), p);
      const sum = b.co2 + b.ch4 + b.n2o + b.stratH2O + b.ozone + b.aviation + b.volcanic + b.solar + b.aerosolLuc;
      expect(Math.abs(sum - b.total), label).toBeLessThan(1e-9);
      // 与引擎总量口径一致：fGHG(三气体) + fOther
      expect(Math.abs(b.total - (forcing.fGHG(co2, ch4, n2o, p) + fOther)), label).toBeLessThan(1e-12);
    }
  });

  it("工业化前基线：全分量归零（无异常强迫）", () => {
    const b = forcingBreakdown(280, 722, 273, 0, forcing.fCH4(722, p), p);
    for (const v of [b.co2, b.ch4, b.n2o, b.stratH2O, b.ozone, b.aviation, b.aerosolLuc, b.total])
      expect(Math.abs(v)).toBeLessThan(1e-12);
  });

  it("2019 锚点：臭氧 ≈ 0.47、航空 ≈ 0.06（AR6 Table 7.8 量级）", () => {
    const b = forcingBreakdown(409.8, 1866, 332, -1.2, forcing.fCH4(1866, p), p);
    expect(b.ozone).toBeCloseTo(0.47, 2);
    expect(b.aviation).toBeCloseTo(0.06, 2);
    expect(b.stratH2O).toBeCloseTo(0.06 * forcing.fCH4(1866, p), 12);
  });

  it("CH₄ 回落到工业化前以下：臭氧/航空锚点缩放钳 0，残差吸收差值", () => {
    const b = forcingBreakdown(350, 600, 280, -1.0, forcing.fCH4(600, p), p);
    expect(b.ozone).toBe(0);
    expect(b.aviation).toBe(0);
    // 闭合不因钳制破坏
    const sum = b.co2 + b.ch4 + b.n2o + b.stratH2O + b.aerosolLuc;
    expect(Math.abs(sum - b.total)).toBeLessThan(1e-9);
  });

  it("火山/太阳报 0 并由 fOther 承载（驱动数据已含历史序列）", () => {
    const b = forcingBreakdown(409.8, 1866, 332, 2.0, forcing.fCH4(1866, p), p);
    expect(b.volcanic).toBe(0);
    expect(b.solar).toBe(0);
    // 残差项吸收 fOther 中除平流层水汽/臭氧/航空外的全部（火山+太阳+气溶胶+LUC）
    expect(b.aerosolLuc).toBeCloseTo(2.0 - b.stratH2O - b.ozone - b.aviation, 12);
  });

  it("分量单调性：CH₄ 浓度升 → ch4/stratH2O/ozone/aviation 单调不减", () => {
    const lo = forcingBreakdown(409.8, 1500, 332, -1.2, forcing.fCH4(1500, p), p);
    const hi = forcingBreakdown(409.8, 1866, 332, -1.2, forcing.fCH4(1866, p), p);
    for (const k of ["ch4", "stratH2O", "ozone", "aviation"] as const)
      expect(hi[k], k).toBeGreaterThanOrEqual(lo[k]);
  });
});
