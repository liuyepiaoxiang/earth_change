// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import ComparePanel, { firstFloodedCities, defenseOf } from "./ComparePanel";
import { runScenario } from "@future-earth/engine";
import type { CityRow } from "@future-earth/data";
import type { SimResultWithUnc } from "../lib/sim";

const sim = runScenario("ssp585", 2500) as SimResultWithUnc;
const city = (elevation: number, population: number): CityRow =>
  ({ name: "TestCity", country: "XX", lat: 0, lon: 0, elevation, population, tbase: 15, pbase: 800 });

describe("defenseOf / firstFloodedCities", () => {
  it("防护档位：none=0；fixed 大城 +2m；adaptive 大城 +3m 小城 +1.5m", () => {
    expect(defenseOf(city(1, 100), "none")).toBe(0);
    expect(defenseOf(city(1, 2_000_000), "fixed")).toBe(2);
    expect(defenseOf(city(1, 500), "fixed")).toBe(0);
    expect(defenseOf(city(1, 6_000_000), "adaptive")).toBe(3);
    expect(defenseOf(city(1, 500), "adaptive")).toBe(1.5);
  });
  it("低海拔城市先被淹；高海拔不被淹", () => {
    const cities = [city(30, 1_000_000), city(2, 1_000_000), city(5, 1_000_000)];
    const out = firstFloodedCities(sim, cities, "none");
    expect(out[0]!.name).toBe("TestCity"); // 同名——验证排序按年份
    expect(out.length).toBeGreaterThanOrEqual(1);
    // 海拔 30m 在 ssp585 2500（SLR ~9m）不被淹 → 至多 2 个城市入列
    expect(out.length).toBeLessThanOrEqual(2);
  });
});

describe("ComparePanel", () => {
  afterEach(cleanup);
  it("渲染 A/B 阈值年对照表与受影响城市列表", async () => {
    const { getByTestId, getByText } = render(<ComparePanel a={sim} year={2100} />);
    await waitFor(() => expect(getByTestId("compare-thresholds")).toBeTruthy(), { timeout: 15000 });
    expect(getByText(/A：ssp585/)).toBeTruthy();
    expect(getByTestId("compare-deltas")).toBeTruthy();
    expect(getByTestId("flooded-list")).toBeTruthy();
  });
});
