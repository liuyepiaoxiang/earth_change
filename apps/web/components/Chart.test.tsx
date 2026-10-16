// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render } from "@testing-library/react";
import Chart from "./Chart";

describe("v0.2 Chart 底座", () => {
  afterEach(cleanup);
  it("渲染 SVG 折线、年份标记、图例与单位", () => {
    const { container, getByText } = render(
      <Chart years={[2000, 2001, 2002]} unit="ppm" markerX={2001}
        series={[{ name: "CO₂", color: "#4ade80", values: [370, 375, 380] }]} />,
    );
    expect(container.querySelector('svg path[stroke="#4ade80"]')).toBeTruthy();
    expect(container.querySelectorAll('line[stroke="#f59e0b"]').length).toBeGreaterThan(0);
    getByText("CO₂");
    getByText("ppm");
  });
});
