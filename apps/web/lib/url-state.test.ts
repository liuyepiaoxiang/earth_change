import { describe, it, expect } from "vitest";
import { parseUrlState, serializeUrlState } from "./url-state.js";
import { DEFAULT_CONTROLS } from "@future-earth/engine";

describe("url-state", () => {
  it("空 URL → 空 state", () => {
    expect(parseUrlState("http://x/")).toEqual({ uncertainty: false });
  });
  it("解析合法参数；非法静默忽略", () => {
    const s = parseUrlState("http://x/?scenario=ssp585&year=2300&unc=1");
    expect(s).toEqual({ scenario: "ssp585", year: 2300, uncertainty: true });
    expect(parseUrlState("http://x/?scenario=rcp45&year=9999").scenario).toBeUndefined();
  });
  it("exp 编码往返一致；坏 base64 忽略", () => {
    const url = serializeUrlState({ scenario: "ssp245", exp: DEFAULT_CONTROLS }, "http://x/");
    expect(parseUrlState(url).exp).toEqual(DEFAULT_CONTROLS);
    expect(parseUrlState("http://x/?exp=%%%").exp).toBeUndefined();
  });
  it("serialize 省略默认项", () => {
    expect(serializeUrlState({ scenario: "ssp245" }, "http://x/")).toBe("http://x/?scenario=ssp245");
  });
});
