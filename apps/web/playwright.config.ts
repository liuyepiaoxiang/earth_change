import { defineConfig } from "@playwright/test";

// E2E 走生产构建（next start），CI 中先 build 再跑；本地复用已起的服务器
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // 共享同一模拟缓存路径，保持确定性
  use: {
    baseURL: "http://localhost:3100",
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: "npx next start -p 3100",
    port: 3100,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
