import { expect, test } from "@playwright/test";

// 对应 docs/05-测试策略与用例矩阵.md §5 冒烟清单中可自动化的部分（S1/S2/R1）；
// S3 淹没视觉与 S4 画布点选城市属视觉/坐标断言，仍走手工冒烟。

test.describe("S1 /api/simulate", () => {
  test("合法请求返回版本化 SimResult", async ({ request }) => {
    const res = await request.get("/api/simulate?scenario=ssp245&horizon=2100");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.schemaVersion).toBe(1);
    expect(body.scenario).toBe("ssp245");
    expect(body.years[0]).toBe(1851);
    expect(body.years.at(-1)).toBe(2100);
    expect(body.metrics.tempAnomaly).toHaveLength(body.years.length);
  });

  test("非法参数 400", async ({ request }) => {
    expect((await request.get("/api/simulate?scenario=bogus")).status()).toBe(400);
    expect((await request.get("/api/simulate?scenario=ssp245&horizon=1800")).status()).toBe(400);
    expect((await request.get("/api/simulate")).status()).toBe(400);
  });
});

test.describe("S2 仪表盘交互", () => {
  test("加载 → 指标栏就绪 → 切情景 → 拖时间轴，全程无页面错误", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.goto("/");
    const header = page.locator("header");
    // 引擎动态加载 + 模拟完成后指标栏出现 CO₂ 数值
    await expect(header).toContainText("ppm", { timeout: 20_000 });
    const before = await header.innerText();

    // 切 SSP5-8.5：指标应变化（缓存未命中，稍等模拟完成）
    await page.getByRole("button", { name: "SSP5-8.5" }).click();
    await expect
      .poll(async () => (await header.innerText()) !== before, { timeout: 15_000 })
      .toBe(true);

    // 拖时间轴到 2300：指标再次变化
    const beforeDrag = await header.innerText();
    await page.getByRole("slider").fill("2300");
    await expect
      .poll(async () => (await header.innerText()) !== beforeDrag, { timeout: 10_000 })
      .toBe(true);
    await expect(page.getByText("2300", { exact: true })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});

test.describe("R1 图层开关回归", () => {
  const LAYERS = ["温度点云", "城市点", "淹没模拟", "降水图层", "卫星底图", "大气辉光"];

  test("每个图层关→开一轮，状态文本正确恢复", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /温度点云/ })).toBeVisible({ timeout: 20_000 });
    for (const name of LAYERS) {
      const btn = page.getByRole("button", { name: new RegExp(name) });
      await btn.click();
      await expect(btn).toContainText("已隐藏");
      await btn.click();
      await expect(btn).toContainText("显示中");
    }
  });

  test("底图两次关→开循环后仍恢复（FLOW-20261011-004 回归点）", async ({ page }) => {
    await page.goto("/");
    const btn = page.getByRole("button", { name: /卫星底图/ });
    await expect(btn).toBeVisible({ timeout: 20_000 });
    for (let i = 0; i < 2; i++) {
      await btn.click();
      await expect(btn).toContainText("已隐藏");
      await btn.click();
      await expect(btn).toContainText("显示中");
    }
  });
});
