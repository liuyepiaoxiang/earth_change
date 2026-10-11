import { describe, it, expect } from "vitest";
import { makeRng, sampleParamOverrides, runScenarioMc, PERTURBED_IDS } from "./mc.js";
import { PARAMETERS } from "@future-earth/spec";

describe("种子化 PRNG", () => {
  it("同种子序列逐位一致，不同种子序列不同", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const c = makeRng(43);
    const sa = Array.from({ length: 10 }, () => a());
    const sb = Array.from({ length: 10 }, () => b());
    const sc = Array.from({ length: 10 }, () => c());
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(sc);
  });

  it("输出落在 [0,1)", () => {
    const rng = makeRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("参数采样", () => {
  const base = PARAMETERS.reduce((acc, p) => ({ ...acc, [p.id]: p.default }), {}) as Parameters<(typeof PARAMETERS)[number]> extends never
    ? never
    : Record<string, number>;

  it("所有样本落在文献先验 [min, max] 内", () => {
    const rng = makeRng(1);
    const ranges = new Map(PARAMETERS.map((p) => [p.id, p]));
    for (let i = 0; i < 200; i++) {
      const o = sampleParamOverrides(rng, base as never);
      for (const [pid, v] of Object.entries(o)) {
        const r = ranges.get(pid as keyof typeof o)!;
        expect(v).toBeGreaterThanOrEqual(r!.min);
        expect(v).toBeLessThanOrEqual(r!.max);
      }
    }
  });

  it("采样键与扰动名单一致", () => {
    const o = sampleParamOverrides(makeRng(2), base as never);
    expect(Object.keys(o).sort()).toEqual([...PERTURBED_IDS].sort());
  });
});

describe("runScenarioMc", () => {
  const mc = runScenarioMc("ssp245", 2100, { n: 40, seed: 12345 });

  it("同 seed 逐位可复现（G5 精神延伸到不确定性路径）", () => {
    const again = runScenarioMc("ssp245", 2100, { n: 40, seed: 12345 });
    expect(JSON.stringify(again)).toBe(JSON.stringify(mc));
  });

  it("不同 seed 产生不同分位（采样真正发生）", () => {
    const other = runScenarioMc("ssp245", 2100, { n: 40, seed: 999 });
    expect(other.tempAnomaly.p10).not.toEqual(mc.tempAnomaly.p10);
  });

  it("分位有序：p10 ≤ p50 ≤ p90（逐年）", () => {
    for (const b of [mc.tempAnomaly, mc.co2, mc.seaLevel]) {
      for (let j = 0; j < mc.years.length; j++) {
        expect(b.p10[j]!).toBeLessThanOrEqual(b.p50[j]! + 1e-9);
        expect(b.p50[j]!).toBeLessThanOrEqual(b.p90[j]! + 1e-9);
      }
    }
  });

  it("不确定带在 2100 年展开（p90 > p10）", () => {
    const j = mc.years.indexOf(2100);
    expect(mc.tempAnomaly.p90[j]!).toBeGreaterThan(mc.tempAnomaly.p10[j]!);
    expect(mc.seaLevel.p90[j]!).toBeGreaterThan(mc.seaLevel.p10[j]!);
  });

  it("p50 中位路径物理合理：ssp245 2100 年 ΔT 落在 1.3–4.5°C", () => {
    const j = mc.years.indexOf(2100);
    expect(mc.tempAnomaly.p50[j]!).toBeGreaterThan(1.3);
    expect(mc.tempAnomaly.p50[j]!).toBeLessThan(4.5);
  });

  it("年份覆盖与 horizon 生效；n 被钳制到最小 2", () => {
    expect(mc.years[0]).toBe(1851);
    expect(mc.years.at(-1)).toBe(2100);
    expect(mc.n).toBe(40);
    const tiny = runScenarioMc("ssp126", 2050, { n: 1 });
    expect(tiny.n).toBe(2);
    expect(tiny.years.at(-1)).toBe(2050);
  });
});
