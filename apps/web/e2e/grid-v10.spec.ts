import { test, expect } from "@playwright/test";

test.describe("v1.0 区域气候场", () => {
  test("GR1：温度场层开启且图例可见（格点纹理升级后仍正常渲染）", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toContainText("ppm", { timeout: 30000 });
    // 温度场图层默认开启（LayerControl 显示为开）
    await expect(page.getByText("地表温度异常")).toBeVisible({ timeout: 10000 });
  });

  test("GR2：区域面板——点采样与框选统计", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toContainText("ppm", { timeout: 30000 });
    await page.getByRole("button", { name: "📊 分析" }).click();
    const drawer = page.getByTestId("analysis-drawer");
    await drawer.getByRole("tab", { name: "区域" }).click();
    await expect(drawer.getByTestId("region-panel")).toBeVisible();
    await expect(drawer.getByTestId("point-sample")).toContainText("°C");
    await expect(drawer.getByTestId("region-stats")).toContainText("温度异常");
    // 改为太平洋点 → 缺测
    await drawer.getByLabel("纬度").fill("0");
    await drawer.getByLabel("经度").fill("-140");
    await expect(drawer.getByTestId("point-sample")).toContainText("—");
  });
});
