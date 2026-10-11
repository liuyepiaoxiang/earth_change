import { describe, it, expect } from "vitest";
import { qIn, qRef, qAbs, qOut, netRadiation } from "./energy.js";

const SIGMA = 5.670374419e-8;
const EPSILON = 0.98;

describe("eq_01–05 辐射能量平衡诊断（v1.x 收尾批）", () => {
  it("eq_01 太阳入射 = S0/4 ≈ 340.25 W/m²（δS=0）", () => {
    expect(qIn()).toBeCloseTo(340.25, 2);
    expect(qIn(0.001)).toBeCloseTo(340.25 * 1.001, 6);
  });

  it("eq_02/03 反射与吸收互补：Q_ref + Q_abs = Q_in", () => {
    for (const alpha of [0.2, 0.3, 0.4]) {
      expect(qRef(alpha) + qAbs(alpha)).toBeCloseTo(qIn(), 9);
    }
  });

  it("eq_04 Stefan-Boltzmann：Te=288.15K → Q_out ≈ ε·σ·T⁴（约 383 W/m²）", () => {
    const expected = EPSILON * SIGMA * 288.15 ** 4;
    expect(qOut(288.15)).toBeCloseTo(expected, 6);
    expect(qOut(288.15)).toBeGreaterThan(370);
    expect(qOut(288.15)).toBeLessThan(395);
  });

  it("eq_05 辐射平衡：α=0.3 的有效发射温度 ≈ 255K，且该处 N≈0", () => {
    const qAbsW = qAbs(0.3);
    const teEq = Math.pow(qAbsW / (EPSILON * SIGMA), 0.25);
    expect(teEq).toBeGreaterThan(250);
    expect(teEq).toBeLessThan(260);
    expect(netRadiation(qAbsW, qOut(teEq))).toBeCloseTo(0, 6);
  });

  it("加热方向符号：升温 → Q_out 增 → N 变负（冷却）", () => {
    const qAbsW = qAbs(0.3);
    const teEq = Math.pow(qAbsW / (EPSILON * SIGMA), 0.25);
    expect(netRadiation(qAbsW, qOut(teEq + 1))).toBeLessThan(0);
  });
});
