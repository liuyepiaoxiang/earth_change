import { expect, test } from "@playwright/test";

test.describe("模型导览 Overview", () => {
  test("首屏说明产品并提供进入模拟入口", async ({ page }) => {
    await page.goto("/overview");
    await expect(page.getByRole("heading", { name: "如果我们走不同的路，地球会变成什么样？" })).toBeVisible();
    await expect(page.getByText("选择一条未来路径，拖动时间轴", { exact: false })).toBeVisible();
    await expect(page.getByRole("link", { name: /进入地球模拟/ })).toHaveAttribute("href", "/?scenario=ssp245&year=2100");
  });

  test("模型链、使用步骤和边界说明可见", async ({ page }) => {
    await page.goto("/overview");
    await expect(page.getByRole("heading", { name: "从排放情景，到温度、海平面和城市结果。" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "用一个问题，完成第一次实验。" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "模型的价值是帮助你看懂趋势，也要知道它的边界。" })).toBeVisible();
  });

  test("完整规格索引支持切换和搜索", async ({ page }) => {
    await page.goto("/overview");
    const catalog = page.locator("#catalog");
    await catalog.getByRole("button", { name: "方程" }).click();
    await catalog.getByPlaceholder("搜索 id、名称或公式").fill("eq_53");
    await expect(catalog.getByText("eq_53", { exact: true })).toBeVisible();
    await expect(catalog.getByText("城市淹没判定", { exact: true })).toBeVisible();
  });
});
