// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { afterEach } from "vitest";
import MetricsBar from "./MetricsBar";
import type { MetricsSnapshot, UncertaintySnapshot } from "../lib/sim";

const snap: MetricsSnapshot = {
  year: 2100,
  tempAnomaly: 2.81,
  co2: 602,
  seaLevel: { total: 0.72, thermal: 0.24, glacier: 0.12, iceSheet: 0.29, landWater: 0.07 },
};

const unc: UncertaintySnapshot = {
  tempP10: 2.41,
  tempP90: 3.37,
  co2P10: 602,
  co2P90: 602, // 情景段浓度外生驱动 → 退化区间
  slP10: 0.66,
  slP90: 0.91,
};

afterEach(cleanup);
describe("MetricsBar（F02 指标栏）", () => {
  it("无快照显示占位符", () => {
    const { container } = render(<MetricsBar snap={null} unc={null} />);
    expect(container.textContent).toBe("—");
  });

  it("显示 ΔT/CO₂/SLR 与四分量", () => {
    const { getByText } = render(<MetricsBar snap={snap} unc={null} />);
    expect(getByText("+2.81°C")).toBeTruthy();
    expect(getByText("602ppm")).toBeTruthy();
    expect(getByText("+0.72m")).toBeTruthy();
    expect(getByText(/热膨 0.24/)).toBeTruthy();
  });

  it("开启不确定性时显示 p10–p90 区间", () => {
    const { getByText } = render(<MetricsBar snap={snap} unc={unc} />);
    expect(getByText("(2.4–3.4)")).toBeTruthy();
    expect(getByText("(0.66–0.91)")).toBeTruthy();
  });

  it("退化区间（CO₂ 浓度外生）不显示", () => {
    const { getByText, queryByText } = render(<MetricsBar snap={snap} unc={unc} />);
    expect(queryByText("(602–602)")).toBeNull();
    expect(getByText("602ppm")).toBeTruthy();
  });
});
