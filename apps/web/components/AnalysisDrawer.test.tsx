// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, fireEvent } from "@testing-library/react";
import AnalysisDrawer from "./AnalysisDrawer";
import type { SimResultWithUnc } from "../lib/sim";
import { runScenario } from "@future-earth/engine";

const sim = runScenario("ssp245", 2100) as SimResultWithUnc;

describe("v0.2 分析抽屉（G0/UX-02）", () => {
  afterEach(cleanup);
  it("五个 tab 可切换且渲染对应面板", () => {
    const { getByRole, getByTestId, getByText } = render(<AnalysisDrawer sim={sim} year={2150} onClose={() => {}} />);
    fireEvent.click(getByRole("tab", { name: "观测对照" }));
    expect(getByText("GISTEMP 观测")).toBeTruthy();
    fireEvent.click(getByRole("tab", { name: "海平面分量" }));
    expect(getByText("热膨胀")).toBeTruthy();
    fireEvent.click(getByRole("tab", { name: "为什么会这样" }));
    expect(getByTestId("contribution-panel")).toBeTruthy();
    fireEvent.click(getByRole("tab", { name: "结果说明" }));
    expect(getByTestId("metadata-panel")).toBeTruthy();
    expect(getByText(/探索性外推/)).toBeTruthy();
  });
  it("时间序列 tab 默认选中", () => {
    const { getByRole } = render(<AnalysisDrawer sim={sim} year={2100} onClose={() => {}} />);
    expect(getByRole("tab", { name: "时间序列" }).getAttribute("aria-selected")).toBe("true");
  });
});
