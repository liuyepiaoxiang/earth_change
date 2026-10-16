import { test, expect } from "@playwright/test";

test.describe("v0.3 情景实验室与分享", () => {
  test("L1：开启实验 → 编辑器可见 → 改排放强度 → 指标变化且 URL 含 exp", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/");
    await expect(page.locator("header")).toContainText("ppm", { timeout: 30000 });
    await page.getByRole("button", { name: "🧪 实验" }).click();
    await page.getByRole("button", { name: "📊 分析" }).click();
    const drawer = page.getByTestId("analysis-drawer");
    await drawer.getByRole("tab", { name: "实验室" }).click();
    await expect(drawer.getByTestId("experiment-editor")).toBeVisible();
    // 改排放强度 → 指标应变化（实验重算）
    const before = await page.locator("header").innerText();
    await drawer.getByLabel("排放强度").fill("0.6");
    await expect
      .poll(async () => (await page.locator("header").innerText()) !== before, { timeout: 20000 })
      .toBe(true);
    await expect.poll(async () => page.url(), { timeout: 5000 }).toContain("exp=");
    expect(errors).toEqual([]);
  });

  test("L2：分享 tab 展示可复现链接", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toContainText("ppm", { timeout: 30000 });
    await page.getByRole("button", { name: "📊 分析" }).click();
    await page.getByTestId("analysis-drawer").getByRole("tab", { name: "分享" }).click();
    const input = page.getByLabel("分享链接");
    await expect(input).toBeVisible();
    await expect(input).toHaveValue(/scenario=/);
  });

  test("L3：/embed 无编辑器但保留指标与时间轴", async ({ page }) => {
    await page.goto("/embed?scenario=ssp370&year=2100");
    await expect(page.locator("header")).toContainText("ppm", { timeout: 30000 });
    await expect(page.getByRole("button", { name: "🧪 实验" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "📊 分析" })).toHaveCount(0);
    await expect(page.getByRole("slider")).toBeVisible();
  });

  test("L4：带 exp 的 URL 直接还原实验态", async ({ page }) => {
    // 与 lib/url-state 编码一致的最小实验（默认 controls 编码）
    const res = await page.request.get("/api/simulate?scenario=ssp245&horizon=2100");
    expect(res.status()).toBe(200); // 前置：服务可用
    await page.goto("/");
    await page.getByRole("button", { name: "🧪 实验" }).click();
    await expect.poll(async () => page.url(), { timeout: 5000 }).toContain("exp=");
    // 刷新后实验态保留
    await page.reload();
    await expect(page.getByRole("button", { name: "🧪 实验" })).toHaveAttribute("aria-pressed", "true", { timeout: 30000 });
  });
});
