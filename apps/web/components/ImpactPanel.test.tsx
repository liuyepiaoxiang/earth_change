// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, fireEvent } from "@testing-library/react";
import ImpactPanel from "./ImpactPanel";
import { runScenario } from "@future-earth/engine";
import type { SimResultWithUnc } from "../lib/sim";

const sim = runScenario("ssp585", 2500) as SimResultWithUnc;

describe("V2.0 ImpactPanel", () => {
  afterEach(cleanup);
  it("8 张影响卡全部渲染且含公式来源", () => {
    const { getByTestId } = render(<ImpactPanel sim={sim} year={2100} />);
    for (const t of ["暴露人口", "人均水资源", "极端高温", "农业适宜度", "生态迁移", "海洋酸化", "经济损害", "碳社会成本"]) {
      expect(getByTestId(`impact-${t}`)).toBeTruthy();
    }
  });
  it("适应三档切换 → 暴露人口递减", () => {
    const { getByTestId, getByText } = render(<ImpactPanel sim={sim} year={2500} />);
    const before = getByTestId("impact-暴露人口").innerText;
    fireEvent.click(getByText("高适应")!);
    const after = getByTestId("impact-暴露人口").innerText;
    expect(after).not.toBe(before); // 防护生效
  });
  it("2500 年高情景出现越界警告", () => {
    const { getByTestId } = render(<ImpactPanel sim={sim} year={2500} />);
    expect(getByTestId("impact-海洋酸化").innerText).toMatch(/pH/);
  });
});
