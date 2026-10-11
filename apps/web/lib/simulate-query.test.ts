import { describe, it, expect } from "vitest";
import { parseSimulateQuery } from "./simulate-query.js";

describe("parseSimulateQuery", () => {
  it("默认 ssp245/2500", () => {
    const q = parseSimulateQuery("http://x/api/simulate");
    expect(q).not.toBeInstanceOf(Error);
    expect((q as { scenario: string }).scenario).toBe("ssp245");
    expect((q as { horizon: number }).horizon).toBe(2500);
  });
  it("合法组合", () => {
    const q = parseSimulateQuery("http://x/api/simulate?scenario=ssp585&horizon=2100");
    expect((q as { scenario: string }).scenario).toBe("ssp585");
    expect((q as { horizon: number }).horizon).toBe(2100);
  });
  it("非法情景 → Error", () => {
    expect(parseSimulateQuery("http://x/api/simulate?scenario=rcp45")).toBeInstanceOf(Error);
  });
  it("horizon 越界 → Error", () => {
    expect(parseSimulateQuery("http://x/api/simulate?horizon=3000")).toBeInstanceOf(Error);
    expect(parseSimulateQuery("http://x/api/simulate?horizon=1900")).toBeInstanceOf(Error);
  });
});
