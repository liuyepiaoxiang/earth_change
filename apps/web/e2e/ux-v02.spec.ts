import { test, expect } from "@playwright/test";

test.describe("v0.2 UX 验收门", () => {
  test("UX-01：30 秒内可见当前年份、情景与三项核心指标", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/");
    await expect(page.getByText("未来地球引擎")).toBeVisible({ timeout: 30000 });
    // 年份显示（Timeline）
    await expect(page.locator("footer")).toContainText(/\d{4}/, { timeout: 30000 });
    // 情景选择器
    await expect(page.getByText("SSP2-4.5").first()).toBeVisible();
    // 三项核心指标（MetricsBar）
    const bar = page.getByTestId("metrics-bar");
    await expect(bar).toContainText("ΔT");
    await expect(bar).toContainText("CO₂");
    await expect(bar).toContainText("SLR");
    expect(errors).toEqual([]);
  });

  test("UX-02：分析面板内一屏可见历史/2100/2500 差异与置信说明", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "📊 分析" }).click();
    const drawer = page.getByTestId("analysis-drawer");
    await expect(drawer).toBeVisible();
    // 时间序列横跨 1851-2500
    await expect(drawer).toContainText("1851");
    await expect(drawer).toContainText("2500");
    // 结果说明：驱动段 + 置信标注
    await drawer.getByRole("tab", { name: "结果说明" }).click();
    await expect(drawer).toContainText("排放驱动");
    await expect(drawer).toContainText("浓度驱动");
    await expect(drawer).toContainText("探索性外推");
    await expect(drawer).toContainText("数据指纹");
  });

  test("UX-02b：2100 后时间轴出现探索性外推标签", async ({ page }) => {
    await page.goto("/");
    const range = page.locator('footer input[type="range"]');
    await range.waitFor({ timeout: 30000 });
    await range.fill("2200");
    await expect(page.locator("footer")).toContainText("探索性外推");
    await range.fill("2050");
    await expect(page.locator("footer")).not.toContainText("探索性外推");
  });
});
