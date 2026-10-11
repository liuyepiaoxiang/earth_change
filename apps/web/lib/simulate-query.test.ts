import { describe, it, expect } from "vitest";
import { parseSimulateQuery } from "./simulate-query.js";

describe("parseSimulateQuery", () => {
  it("缺省参数 → Error（两参数必填，E2E 抓出的缺陷回归点）", () => {
    expect(parseSimulateQuery("http://x/api/simulate")).toBeInstanceOf(Error);
    expect(parseSimulateQuery("http://x/api/simulate?scenario=ssp245")).toBeInstanceOf(Error);
    expect(parseSimulateQuery("http://x/api/simulate?horizon=2100")).toBeInstanceOf(Error);
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
