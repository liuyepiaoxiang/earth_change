import { describe, it, expect } from "vitest";
import { runSim, rhs } from "./solver.js";
import { makeHistoricalDrivers, initialState } from "./scenario.js";
import { PARAMETER_DEFAULTS } from "@future-earth/spec";
import type { Params } from "./types.js";

function defaultParams(): Params {
  const p: Record<string, number> = {};
  Object.assign(p, PARAMETER_DEFAULTS);
  return p as Params;
}

describe("求解器", () => {
  const opts = () => ({ startYear: 1850, endYear: 2024, initialState: initialState(), driversAt: makeHistoricalDrivers(), params: defaultParams() });

  it("历史运行 1850-2024：无发散、记录 174 条（1851..2024）、有限值", () => {
    const out = runSim(opts());
    expect(out.records).toHaveLength(174);
    expect(out.records.at(-1)!.year).toBe(2024);
    for (const r of out.records) {
      expect(Number.isFinite(r.co2)).toBe(true);
      expect(Number.isFinite(r.tempAnomaly)).toBe(true);
    }
  });
  it("G5-质量守恒：碳收支残差 < 1%", () => {
    const out = runSim(opts());
    expect(out.carbon.residualRatio).toBeLessThan(0.01);
  });
  it("G5-确定性：同参数两次运行结果逐位一致", () => {
    const a = runSim(opts()), b = runSim(opts());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it("rhs：人为清零排放 → CO₂ 变率为负（汇主导）", () => {
    const p = defaultParams();
    const s = initialState(422);
    const d = { year: 2024, efossil: 0, eluluc: 0, ch4: 1930, n2o: 337, fOther: -0.75 };
    expect(rhs(s, d, p).co2).toBeLessThan(0);
  });
});
