import { describe, it, expect } from "vitest";
import { generateShareText, xShareUrl } from "./share-text.js";
import { runScenario } from "@future-earth/engine";

const sim = runScenario("ssp585", 2500);

describe("V0.4 分享文案生成", () => {
  it("基础情景分享：包含情景/年份/温度/海平面/链接", () => {
    const text = generateShareText({ sim, year: 2100 });
    expect(text).toContain("ssp585");
    expect(text).toContain("2100");
    expect(text).toContain("°C");
    expect(text).toContain("m");
    expect(text).toContain("earth-change.vercel.app");
  });
  it("城市分享：包含城市名", () => {
    const text = generateShareText({ sim, year: 2100, cityName: "上海" });
    expect(text).toContain("上海");
  });
  it("对比分享：包含差值", () => {
    const text = generateShareText({ sim, year: 2100, compareScenario: "ssp126", compareMetrics: { dT: 1.8, slr: 0.5 } });
    expect(text).toContain("相差");
    expect(text).toContain("ssp126");
  });
  it("X URL 格式", () => {
    const url = xShareUrl("test");
    expect(url).toContain("twitter.com/intent/tweet");
    expect(url).toContain("test");
  });
});
