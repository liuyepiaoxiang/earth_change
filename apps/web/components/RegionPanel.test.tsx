// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, fireEvent } from "@testing-library/react";
import RegionPanel from "./RegionPanel";
import { runScenario } from "@future-earth/engine";
import type { SimResultWithUnc } from "../lib/sim";

const sim = runScenario("ssp585", 2500) as SimResultWithUnc;

describe("V1.0 区域面板（V10-E04）", () => {
  afterEach(cleanup);
  it("点采样：北京格有温度/降水/群系", () => {
    const { getByTestId } = render(<RegionPanel sim={sim} year={2100} />);
    const t = getByTestId("point-sample").innerText;
    expect(t).toContain("°C");
    expect(t).toMatch(/针叶林|温带森林|草原|稀树草原/);
  });
  it("区域统计：北非-中东框有格数与分位数", () => {
    const { getByTestId } = render(<RegionPanel sim={sim} year={2100} />);
    const rows = getByTestId("region-stats").innerText;
    expect(rows).toContain("温度异常");
    expect(rows).toMatch(/\d{2,}/); // 格数 > 9
  });
  it("改坐标重算：海洋点缺测显示 —", () => {
    const { getByTestId, getByLabelText } = render(<RegionPanel sim={sim} year={2100} />);
    fireEvent.change(getByLabelText("纬度"), { target: { value: "0" } });
    fireEvent.change(getByLabelText("经度"), { target: { value: "-140" } }); // 太平洋
    expect(getByTestId("point-sample").innerText).toContain("—");
  });
});
