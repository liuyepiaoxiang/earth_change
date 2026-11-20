import type { Page } from "@playwright/test";

/** F23 E2E 兼容：首访猜猜看弹层默认被标记为已看过（避免挡住既有用例的页面交互）。
 *  弹层本身的行为用 quiz-intro.spec.ts 单独覆盖（不设标记走真实首访路径）。 */
export async function skipIntroQuiz(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try { window.localStorage.setItem("fe-quiz-intro-v1", "1"); } catch { /* 忽略 */ }
  });
}
