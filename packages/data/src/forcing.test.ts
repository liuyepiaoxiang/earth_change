import { describe, it, expect } from "vitest";
import { loadForcing, loadScenario } from "./loaders.js";

describe("forcing 与情景", () => {
  it("forcing_natural：1850-2024 连续，Pinatubo 1992 是强负值", () => {
    const f = loadForcing();
    expect(f).toHaveLength(175);
    const pin = f.find((r) => r.year === 1992)!;
    expect(pin.fOther).toBeLessThan(-2.0);
    expect(f.at(-1)!.ch4).toBeGreaterThan(1800);
    expect(f.at(-1)!.n2o).toBeGreaterThan(330);
  });
  it("四情景 2025-2500 完整且首年衔接", () => {
    for (const id of ["ssp126", "ssp245", "ssp370", "ssp585"] as const) {
      const s = loadScenario(id);
      expect(s.years[0]).toBe(2025);
      expect(s.years.at(-1)).toBe(2500);
      expect(s.years).toHaveLength(476);
      expect(s.efossil[0]).toBeGreaterThan(9);
    }
  });
});
