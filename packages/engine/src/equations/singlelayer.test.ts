import { describe, it, expect } from "vitest";
import { runSingleLayer, singleLayerEquilibrium } from "./singlelayer.js";

const P = { lambda: 1.2, gamma_ocean: 0.75, c_s: 8.2 };

describe("eq_10 单层温度响应对比诊断（v1.x 收尾批）", () => {
  it("解析解校验：常值强迫下积分收敛到 Ta_eq = (F+γTo)/(λ+γ)", () => {
    const F = 3.7; // CO₂ 倍增强迫量级
    const series = runSingleLayer({ start: 1851, end: 2200 }, () => F, P);
    const eq = singleLayerEquilibrium(F, P);
    expect(eq).toBeCloseTo(3.7 / 1.95, 6);
    expect(series.at(-1)!.ta).toBeCloseTo(eq, 2); // 350 年足够收敛
  });

  it("无强迫时保持初值（Ta0=0 → 恒 0）", () => {
    const series = runSingleLayer({ start: 1851, end: 1900 }, () => 0, P);
    for (const r of series) expect(r.ta).toBe(0);
  });

  it("逐年步进输出、步长 1", () => {
    const series = runSingleLayer({ start: 2000, end: 2010 }, () => 1, P);
    expect(series).toHaveLength(11);
    expect(series[0]!.year).toBe(2000);
    expect(series.at(-1)!.year).toBe(2010);
  });

  it("对比语义：单层收敛快于两层（多年代际 drift 被低估的演示）", () => {
    // 两层模型在 2020 年（170 年后）仍未达平衡（深海慢响应）；单层应已接近平衡
    const F = 3.7;
    const series = runSingleLayer({ start: 1851, end: 2020 }, () => F, P);
    const eq = singleLayerEquilibrium(F, P);
    const frac = series.at(-1)!.ta / eq;
    expect(frac).toBeGreaterThan(0.9); // 单层 170 年已 >90% 收敛
    expect(frac).toBeLessThan(1.0);
  });
});
