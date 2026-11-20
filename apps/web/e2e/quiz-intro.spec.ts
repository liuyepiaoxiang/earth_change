import { expect, test } from "@playwright/test";

// F23-A1：首访猜猜看弹层（真实首访路径——不设 localStorage 标记）。
// 既有用例经 helpers.skipIntroQuiz 跳过弹层，弹层行为只在这里覆盖。

test.describe("A1 进站猜猜看弹层", () => {
  test("首访弹出 dialog → 滑杆答题 → 揭晓 → 开始探索关闭；刷新不再弹", async ({ page }) => {
    await page.goto("/");
    const dlg = page.locator('[role="dialog"]');
    await expect(dlg).toBeVisible({ timeout: 30000 }); // 等 Worker 算完 sim
    await expect(dlg.getByText(/2100/)).toBeVisible();

    // 滑杆设 1.5°C（默认值附近，不做精确判分断言——引擎序列随版本演进）
    const slider = dlg.getByRole("slider");
    await slider.fill("1.5");
    await dlg.getByText(/揭晓答案|Reveal answer/).click();
    await expect(dlg.getByText(/实际升温|actual 2100 warming/)).toBeVisible();

    // 开始探索 → 关闭
    await dlg.getByText(/开始探索|Start exploring/).click();
    await expect(dlg).toBeHidden();

    // 标记已写 → 刷新不再弹
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2500);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });
});
