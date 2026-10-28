import { expect, test } from "@playwright/test";
import { PNG } from "pngjs";

// 对应 docs/05 §6 此前的两个测试缺口：
// S3 淹没视觉（像素统计对照，不做快照 diff——跨平台渲染差异大）
// S4 画布点选城市（放大 + 海岸带扫描点击，断言 CityPanel 出现）

/** 统计截图中「淹没水色」像素数（青/浅蓝调：G、B 高于 R 且亮度足够） */
function countFloodPixels(png: PNG): number {
  let n = 0;
  for (let i = 0; i < png.width * png.height; i++) {
    const r = png.data[i * 4]!;
    const g = png.data[i * 4 + 1]!;
    const b = png.data[i * 4 + 2]!;
    // 水色系 #38bdf8 与底图海洋深蓝的区分：淹没色明亮（g>150, b>180, r<g）
    if (g > 140 && b > 170 && r < g && b >= g) n++;
  }
  return n;
}

test.describe("S3 淹没视觉（像素统计对照）", () => {
  test("SSP5-8.5：2500 年淹没像素显著多于 2100 年（同视角同裁剪区）", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));
    await page.goto("/");
    await expect(page.getByRole("button", { name: "SSP5-8.5" })).toBeVisible({ timeout: 20_000 });

    // 统一视角与状态：SSP5-8.5、关温度场（避免点云遮挡）、关城市点（纯 shader 淹没）
    await page.getByRole("button", { name: "SSP5-8.5" }).click();
    await page.getByRole("button", { name: /温度场/ }).click();
    await page.getByRole("button", { name: /城市点/ }).click();
    await page.waitForTimeout(1500);

    const clip = { x: 400, y: 110, width: 480, height: 500 }; // 球体主体区域

    await page.getByRole("slider").fill("2100");
    await page.waitForTimeout(1200);
    const s2100 = PNG.sync.read(await page.screenshot({ clip }));

    await page.getByRole("slider").fill("2500");
    await page.waitForTimeout(1200);
    const s2500 = PNG.sync.read(await page.screenshot({ clip }));

    const f2100 = countFloodPixels(s2100);
    const f2500 = countFloodPixels(s2500);
    // SLR 0.91m → 9.26m：淹没带必须显著扩张（阈值取绝对差，避免归一化脆弱性）
    expect(f2500).toBeGreaterThan(f2100 + 200);
    expect(pageErrors).toEqual([]);
  });
});

test.describe("S4 画布点选城市", () => {
  test("放大后点击西非海岸城市点弹出 CityPanel", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));
    await page.goto("/");
    await expect(page.locator("header")).toContainText("ppm", { timeout: 20_000 });

    // 露出城市点：关温度场与淹没模拟
    await page.getByRole("button", { name: /温度场/ }).click();
    await page.getByRole("button", { name: /淹没模拟/ }).click();

    // 放大 ×6（确定性视角：初始 (0°E,0°N)，滚轮沿视线 dolly）
    for (let i = 0; i < 6; i++) {
      await page.evaluate(`(() => {
        const c = document.querySelector('canvas');
        c.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -600, clientX: 640, clientY: 360 }));
        return 1;
      })()`);
      await page.waitForTimeout(300);
    }

    // 网格扫描 + click，命中判定：CityPanel 出现「本地升温」（任意城市即可）。
    // 扫描窗口不依赖本地实测的精确像素位置（CI 的字体/布局渲染有细微差异会平移投影），
    // 覆盖中央大区域、由内向外扫描，控制总耗时 < 40s。
    let hit = false;
    const targets: Array<[number, number]> = [];
    for (let y = 160; y <= 400; y += 40) for (let x = 340; x <= 940; x += 40) targets.push([x, y]);
    for (const [x, y] of targets) {
      await page.mouse.move(x, y);
      await page.mouse.click(x, y);
      if ((await page.getByText(/本地升温/).count()) > 0) {
        hit = true;
        break;
      }
      await page.waitForTimeout(80);
    }
    expect(hit).toBe(true);
    await expect(page.getByText(/已被海平面淹没|未淹没/)).toBeVisible();
    await expect(page.getByText(/群系/)).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
