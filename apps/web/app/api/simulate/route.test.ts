import { describe, it, expect } from "vitest";
import { GET } from "./route";
import { DEFAULT_CONTROLS } from "@future-earth/engine";
import { encodeExp } from "../../../lib/url-state";

describe("V0.3 /api/simulate：exp + canonicalUrl + summary", () => {
  it("普通请求：summary 齐全，canonicalUrl 含 scenario", async () => {
    const res = GET(new Request("http://x/api/simulate?scenario=ssp585&horizon=2500"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.summary.scenario).toBe("ssp585");
    expect(body.summary.dT2100).toBeGreaterThan(3);
    expect(body.summary.crossings.t15).toBeLessThan(body.summary.crossings.t20!);
    expect(body.canonicalUrl).toContain("scenario=ssp585");
    expect(body.canonicalUrl).not.toContain("exp=");
  });
  it("exp 请求：experiment 回显 + canonicalUrl 含 exp + driverMode 排放驱动", async () => {
    const url = `http://x/api/simulate?scenario=ssp245&horizon=2100&exp=${encodeExp(DEFAULT_CONTROLS)}`;
    const body = await (await GET(new Request(url))).json();
    expect(body.experiment.controls.emissionScale).toBe(1);
    expect(body.metadata.driverMode).toBe("emissions-driven");
    expect(body.canonicalUrl).toContain("exp=");
    expect(body.summary.experiment.controls.netZeroYear).toBe(2100);
  });
  it("无效 exp → 400", async () => {
    const res = GET(new Request("http://x/api/simulate?exp=%%%"));
    expect(res.status).toBe(400);
  });
});
