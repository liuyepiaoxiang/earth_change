import { describe, it, expect } from "vitest";
import { loadSpec } from "./load-spec.js";

describe("scenarios", () => {
  it("四情景齐全", () => {
    const ids = loadSpec().scenarios.map((s) => s.id);
    expect(ids).toEqual(["ssp126", "ssp245", "ssp370", "ssp585"]);
  });
  it("锚点年份升序且覆盖 2025-2500", () => {
    for (const s of loadSpec().scenarios) {
      const yrs = Object.keys(s.co2_emission_anchors_gtc).map(Number).sort((a, b) => a - b);
      expect(yrs[0]!, s.id).toBe(2025);
      expect(yrs.at(-1)!, s.id).toBe(2500);
    }
  });
});
