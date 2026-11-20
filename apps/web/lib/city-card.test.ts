// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeAll } from "vitest";
import { generateCityCard } from "./city-card";
import type { SimResultWithUnc } from "./sim";
import type { CityRow } from "@future-earth/data";

/** happy-dom 的 getContext 默认返回 null——仓库首例 canvas mock：记录调用、toBlob 捕获 blob */
beforeAll(() => {
  const drawing = {
    fillRect: vi.fn(), fillText: vi.fn(), strokeRect: vi.fn(),
    beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
    setLineDash: vi.fn(), save: vi.fn(), restore: vi.fn(),
    measureText: vi.fn((s: string) => ({ width: s.length * 8 })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) {
    return drawing as unknown as CanvasRenderingContext2D;
  });
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, cb: BlobCallback) {
    cb(new Blob(["png"], { type: "image/png" }));
  });
  (globalThis as Record<string, unknown>).__drawing = drawing;
});

const city: CityRow = {
  name: "Shanghai", country: "CN", lat: 31.22, lon: 121.46,
  elevation: 4, elevationSource: "geonames", population: 24874500, tbase: 16.42, pbase: 1049,
};
const sim = {
  scenario: "ssp585", modelVersion: "4.2.0", years: [2030, 2060, 2100],
  metrics: {
    tempAnomaly: [1.5, 2.5, 3.5],
    seaLevel: { total: [0.1, 0.3, 0.7], thermal: [], glacier: [], iceSheet: [], landWater: [] },
    co2: [],
  },
} as unknown as SimResultWithUnc;

describe("C1 城市命运分享卡（canvas mock 仓库首例）", () => {
  it("绘制流水线走通：fillText 多次（含城市名/首淹年/品牌尾注）、曲线 stroke、toBlob 触发", async () => {
    const downloadSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    generateCityCard({ city, sim, pattern: [], firstFlood: 2065, year: 2100 }, "zh");
    const drawing = (globalThis as Record<string, unknown>).__drawing as Record<string, ReturnType<typeof vi.fn>>;
    const fillText = drawing.fillText!;
    const stroke = drawing.stroke!;
    expect(fillText.mock.calls.some((c) => String(c[0]).includes("Shanghai"))).toBe(true);
    expect(fillText.mock.calls.some((c) => String(c[0]) === "2065")).toBe(true);
    expect(fillText.mock.calls.some((c) => String(c[0]).includes("earth-change"))).toBe(true);
    expect(stroke.mock.calls.length).toBeGreaterThan(0); // 双曲线 + 零线 + marker
    await new Promise((r) => setTimeout(r, 10)); // toBlob 回调异步 → a.click
    expect(downloadSpy).toHaveBeenCalled();
    downloadSpy.mockRestore();
  });

  it("getContext 不可用（真实 null 环境）→ 抛错而非静默", async () => {
    const orig = HTMLCanvasElement.prototype.getContext;
    (HTMLCanvasElement.prototype as unknown as { getContext: () => null }).getContext = () => null;
    try {
      expect(() => generateCityCard({ city, sim, pattern: [], firstFlood: null, year: 2100 }, "en")).toThrow();
    } finally {
      // beforeAll 的 spy 已被覆盖，恢复为 mock 形态避免污染其他用例
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(orig as never);
    }
  });
});
