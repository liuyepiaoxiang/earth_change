// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { cleanup, render, fireEvent } from "@testing-library/react";
import { afterEach } from "vitest";
import CityPanel from "./CityPanel";
import type { CityRow } from "@future-earth/data";
import type { MetricsSnapshot } from "../lib/sim";
import { loadWarmingPattern } from "@future-earth/data";

const city: CityRow = {
  name: "Shanghai",
  country: "CN",
  lat: 31.22,
  lon: 121.46,
  elevation: 0,
  population: 24874500,
  tbase: 16.42,
  pbase: 1049,
};

const snap: MetricsSnapshot = {
  year: 2100,
  tempAnomaly: 2.81,
  co2: 602,
  seaLevel: { total: 0.72, thermal: 0.24, glacier: 0.12, iceSheet: 0.29, landWater: 0.07 },
};

afterEach(cleanup);
describe("CityPanel（F04 城市面板）", () => {
  it("低海拔城市显示淹没、本地升温与群系", () => {
    const { getByText } = render(
      <CityPanel city={city} snap={snap} pattern={loadWarmingPattern()} onClose={() => {}} />,
    );
    expect(getByText(/Shanghai/)).toBeTruthy();
    expect(getByText(/已被海平面淹没/)).toBeTruthy(); // 高程 0 < SLR 0.72
    // 本地升温 = 2.81 × 默认带 amp(31°)≈1.232 ≈ 3.46 → 年均温 ≈ 16.42 + 3.46 = 19.9
    expect(getByText(/19\.9°C/)).toBeTruthy();
    expect(getByText(/稀树草原/)).toBeTruthy(); // 19.9°C < 20 且降水 1108 < 1200
  });

  it("高海拔城市不显示淹没，降水按全球 ΔT 缩放", () => {
    const high: CityRow = { ...city, name: "Lhasa", elevation: 3650, tbase: 8.0, pbase: 420 };
    const { getByText } = render(
      <CityPanel city={high} snap={snap} pattern={loadWarmingPattern()} onClose={() => {}} />,
    );
    expect(getByText(/未淹没/)).toBeTruthy();
    // 降水 = 420 × (1 + 0.02 × 2.81) ≈ 444mm
    expect(getByText(/444mm/)).toBeTruthy();
  });

  it("点击关闭按钮触发 onClose", () => {
    const onClose = vi.fn();
    const { getByLabelText } = render(
      <CityPanel city={city} snap={snap} pattern={loadWarmingPattern()} onClose={onClose} />,
    );
    fireEvent.click(getByLabelText("关闭城市面板"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
