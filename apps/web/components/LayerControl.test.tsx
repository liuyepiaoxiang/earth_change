// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { cleanup, render, fireEvent } from "@testing-library/react";
import { afterEach } from "vitest";
import LayerControl, { DEFAULT_LAYERS } from "./LayerControl";

afterEach(cleanup);
describe("LayerControl（F06 图层开关）", () => {
  it("渲染五个图层开关，初始全部显示中", () => {
    const { getByRole } = render(<LayerControl layers={DEFAULT_LAYERS} onToggle={() => {}} />);
    for (const name of ["温度场", "城市点", "淹没模拟", "卫星底图", "大气辉光"]) {
      const btn = getByRole("button", { name: new RegExp(name) });
      expect(btn.textContent).toContain("显示中");
    }
  });

  it("点击回调携带正确的图层键", () => {
    const onToggle = vi.fn();
    const { getByRole } = render(<LayerControl layers={DEFAULT_LAYERS} onToggle={onToggle} />);
    fireEvent.click(getByRole("button", { name: /温度场/ }));
    fireEvent.click(getByRole("button", { name: /淹没模拟/ }));
    expect(onToggle).toHaveBeenNthCalledWith(1, "temperature");
    expect(onToggle).toHaveBeenNthCalledWith(2, "flood");
  });

  it("关闭状态显示已隐藏", () => {
    const layers = { ...DEFAULT_LAYERS, temperature: false };
    const { getByRole } = render(<LayerControl layers={layers} onToggle={() => {}} />);
    expect(getByRole("button", { name: /温度场/ }).textContent).toContain("已隐藏");
  });
});
