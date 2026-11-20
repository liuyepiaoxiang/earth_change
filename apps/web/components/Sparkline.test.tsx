// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Sparkline from "./Sparkline";

const years = [2000, 2010, 2020, 2030, 2040, 2050];
const values = [16.4, 16.9, 17.5, 18.2, 19.0, 19.8];

describe("Sparkline（F22 城市卡片迷你时间线）", () => {
  it("确定性：同数据两次渲染 path 完全一致", () => {
    const a = render(<Sparkline years={years} values={values} color="#f87171" unit="°C" ariaLabel="年均温" />);
    const b = render(<Sparkline years={years} values={values} color="#f87171" unit="°C" ariaLabel="年均温" />);
    const pa = a.container.querySelectorAll("path")[0]!.getAttribute("d");
    const pb = b.container.querySelectorAll("path")[0]!.getAttribute("d");
    expect(pa).toBeTruthy();
    expect(pa).toBe(pb);
  });

  it("当前年 marker：markerYear 在域内画出橙色竖虚线，域外不画", () => {
    const { container, rerender } = render(
      <Sparkline years={years} values={values} color="#f87171" unit="°C" markerYear={2020} ariaLabel="t" />,
    );
    const marker = (c: HTMLElement) =>
      [...c.querySelectorAll("line")].find((l) => l.getAttribute("stroke") === "#f59e0b");
    expect(marker(container)).toBeTruthy();
    rerender(<Sparkline years={years} values={values} color="#f87171" unit="°C" markerYear={1990} ariaLabel="t" />);
    expect(marker(container)).toBeFalsy();
  });

  it("dangerBelow：低于阈值的点段出现红色描边路径，高于阈值时无红段", () => {
    const safe = [10, 10, 10, 10];
    const { container, rerender } = render(
      <Sparkline years={years} values={values} color="#38bdf8" unit="m" dangerBelow={0} ariaLabel="t" />,
    );
    const redPath = (c: HTMLElement) => [...c.querySelectorAll("path")].filter((p) => p.getAttribute("stroke") === "#ef4444");
    expect(redPath(container).length).toBe(0); // 全部高于 0
    rerender(<Sparkline years={years.slice(0, 4)} values={[5, 2, -1, -3]} color="#38bdf8" unit="m" dangerBelow={0} ariaLabel="t" />);
    expect(redPath(container).length).toBeGreaterThan(0);
    expect(safe).toHaveLength(4);
  });

  it("空/断值容错：不足 2 点或全 null 渲染占位符不崩", () => {
    expect(() => render(<Sparkline years={[2000]} values={[1]} color="#fff" unit="x" ariaLabel="t" />)).not.toThrow();
    expect(() => render(<Sparkline years={years} values={years.map(() => null)} color="#fff" unit="x" ariaLabel="t" />)).not.toThrow();
    const { container } = render(
      <Sparkline years={years} values={[1, null, 3, null, 5, 6]} color="#fff" unit="x" ariaLabel="t" />,
    );
    expect(container.querySelectorAll("path").length).toBeGreaterThan(0); // null 断开成多段
  });
});
