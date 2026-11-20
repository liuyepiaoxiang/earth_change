// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { cleanup, render, fireEvent } from "@testing-library/react";
import { afterEach } from "vitest";
import CityQuickSearch from "./CityQuickSearch";
import type { CityRow } from "@future-earth/data";

const cities: CityRow[] = [
  { name: "Shanghai", country: "CN", lat: 31, lon: 121, elevation: 4, elevationSource: "geonames", population: 2e7, tbase: 16, pbase: 1000 },
  { name: "Shantou", country: "CN", lat: 23, lon: 116, elevation: 8, elevationSource: "geonames", population: 5e6, tbase: 21, pbase: 1500 },
  { name: "Paris", country: "FR", lat: 48, lon: 2, elevation: 35, elevationSource: "geonames", population: 2e6, tbase: 11, pbase: 650 },
];

afterEach(cleanup);

describe("A2 首屏城市搜索直达", () => {
  it("输入前缀 → 过滤结果；点击回调 onSelect 并清空输入", () => {
    const onSelect = vi.fn();
    const { getByLabelText, getByText, container } = render(<CityQuickSearch cities={cities} onSelect={onSelect} />);
    fireEvent.change(getByLabelText(/你的城市/), { target: { value: "sha" } });
    fireEvent.click(getByText(/^Shanghai/));
    expect(onSelect).toHaveBeenCalledWith(cities[0]);
    expect((container.querySelector("input") as HTMLInputElement).value).toBe("");
  });

  it("无匹配 → 无结果面板", () => {
    const { getByLabelText, container } = render(<CityQuickSearch cities={cities} onSelect={() => {}} />);
    fireEvent.change(getByLabelText(/你的城市/), { target: { value: "zzz" } });
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });
});
