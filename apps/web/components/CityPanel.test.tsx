// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { cleanup, render, fireEvent } from "@testing-library/react";
import { afterEach } from "vitest";
import CityPanel from "./CityPanel";
import type { CityRow } from "@future-earth/data";
import type { MetricsSnapshot, SimResultWithUnc } from "../lib/sim";
import { loadWarmingPattern, loadCities } from "@future-earth/data";

const city: CityRow = {
  name: "Shanghai",
  country: "CN",
  lat: 31.22,
  lon: 121.46,
  elevation: 0,
  elevationSource: "worldclim",
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

/** 最小 SimResultWithUnc（卡片只用 years + tempAnomaly + seaLevel.total，其余字段契约测试覆盖） */
const sim = {
  years: [2030, 2060, 2100],
  metrics: {
    tempAnomaly: [1.5, 2.2, 2.81],
    seaLevel: { total: [0.1, 0.3, 0.72], thermal: [], glacier: [], iceSheet: [], landWater: [] },
  },
} as unknown as SimResultWithUnc;

const cities = loadCities();

afterEach(cleanup);
describe("CityPanel（F04/F22 城市富卡片）", () => {
  const props = {
    snap, sim, year: 2100, cities, pattern: loadWarmingPattern(),
    onSelectCity: () => {}, onClose: () => {},
  };

  it("低海拔城市显示淹没、风险徽章、本地升温（含热岛）与群系", () => {
    const { getByText } = render(<CityPanel city={city} {...props} />);
    expect(getByText(/Shanghai/)).toBeTruthy();
    expect(getByText(/已被海平面淹没/)).toBeTruthy(); // 高程 0 < SLR 0.72
    expect(getByText(/危急/)).toBeTruthy(); // 高程 0 < 2 → Critical 徽章
    // 本地升温 = 2.81 × 默认带 amp(31°)≈1.232 ≈ 3.46；城市热岛 = 0.55·log10(2487.45)+0.5 ≈ 2.37
    // 年均温 = 16.42 + 3.46 + 2.37 ≈ 22.2
    expect(getByText(/22\.2°C/)).toBeTruthy();
    expect(getByText(/^\+2\.4°C$/)).toBeTruthy(); // eq_54 城市热岛 ≈ 2.37 → 一位小数 2.4
    expect(getByText(/稀树草原/)).toBeTruthy(); // 22.2°C > 20 且降水 1108 < 1500 → 热带干旱系
  });

  it("F22 迷你时间线：温度/淹没余量两条 sparkline + 当前年 marker + 首淹年份", () => {
    const { getAllByRole, getByText, getAllByText } = render(<CityPanel city={city} {...props} />);
    const svgs = getAllByRole("img").filter((el) => el.tagName === "svg");
    expect(svgs.length).toBeGreaterThanOrEqual(2); // 年均温 + 淹没余量
    // mock 序列 >2025 首个淹没（elev 0 ≤ 0.1）→ 首淹 2030（sparkline 首年标注同为 2030，取全部匹配）
    expect(getByText(/首淹年份/)).toBeTruthy();
    expect(getAllByText(/^2030$/).length).toBeGreaterThanOrEqual(1);
  });

  it("F22 城市切换：热门 chips 点击回调 onSelectCity；搜索过滤并可选", () => {
    const onSelectCity = vi.fn();
    // chips 数据驱动（高程 <10m 前 8），与组件同源逻辑算期望
    const expected = cities.find((c) => c.elevationSource !== "unknown" && c.elevation < 10 && c.name !== "Shanghai")!;
    const { getByText, getByPlaceholderText, container } = render(<CityPanel city={city} {...props} onSelectCity={onSelectCity} />);
    fireEvent.click(getByText(new RegExp(`^${expected.name}$`)));
    expect(onSelectCity).toHaveBeenCalledWith(expected);
    // 搜索：输入该城市名前缀出现结果按钮，点击同样回调
    fireEvent.change(getByPlaceholderText(/搜索/), { target: { value: expected.name.slice(0, 3) } });
    const resultBtn = [...container.querySelectorAll("button")].find((b) => b.textContent!.startsWith(expected.name));
    expect(resultBtn).toBeTruthy();
    fireEvent.click(resultBtn!);
    expect(onSelectCity).toHaveBeenCalledTimes(2);
  });

  it("高海拔城市不显示淹没，降水按全球 ΔT 缩放", () => {
    const high: CityRow = { ...city, name: "Lhasa", elevation: 3650, tbase: 8.0, pbase: 420 };
    const { getByText } = render(<CityPanel city={high} {...props} />);
    expect(getByText(/未淹没/)).toBeTruthy();
    // 降水 = 420 × (1 + 0.02 × 2.81) ≈ 444mm
    expect(getByText(/444mm/)).toBeTruthy();
    expect(getByText(/2500 年内不淹没/)).toBeTruthy(); // 高程 3650 → horizon 内不淹
  });

  it("点击关闭按钮触发 onClose", () => {
    const onClose = vi.fn();
    const { getByLabelText } = render(<CityPanel city={city} {...props} onClose={onClose} />);
    fireEvent.click(getByLabelText("关闭城市面板"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
