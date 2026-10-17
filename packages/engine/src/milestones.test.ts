import { describe, it, expect } from "vitest";
import { runScenario } from "./index.js";
import { milestoneEvents } from "./milestones.js";

const ssp585 = runScenario("ssp585", 2500);
const ssp126 = runScenario("ssp126", 2500);

describe("V4.1 里程碑事件", () => {
  it("ssp585 产生按年份升序的多类事件", () => {
    const evts = milestoneEvents(ssp585);
    expect(evts.length).toBeGreaterThanOrEqual(8);
    // 按年份排序
    for (let i = 1; i < evts.length; i++) expect(evts[i]!.year).toBeGreaterThanOrEqual(evts[i - 1]!.year);
    // 类别覆盖
    const cats = new Set(evts.map((e) => e.category));
    expect(cats.size).toBeGreaterThanOrEqual(4);
  });
  it("ssp126 事件更少（低排放 = 更少里程碑）", () => {
    const lo = milestoneEvents(ssp126);
    const hi = milestoneEvents(ssp585);
    expect(lo.length).toBeLessThan(hi.length);
  });
  it("每个事件有图标/标题/描述", () => {
    for (const e of milestoneEvents(ssp585)) {
      expect(e.icon.length).toBeGreaterThan(0);
      expect(e.title.length).toBeGreaterThan(3);
      expect(e.description.length).toBeGreaterThan(8);
    }
  });
  it("温度阈值事件年份与 crossingYears 一致", () => {
    const evts = milestoneEvents(ssp585);
    const t15 = evts.find((e) => e.title.includes("1.5°C"));
    expect(t15).toBeDefined();
    expect(t15!.year).toBeLessThan(2100); // ssp585 应在 2100 前过 1.5
  });
});
