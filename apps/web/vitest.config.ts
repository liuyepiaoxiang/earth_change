import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts", "app/**/*.test.ts", "components/**/*.test.tsx"],
    // 组件测试用 jsdom（按文件 docblock 声明环境），纯函数测试保持 node
    environment: "node",
  },
  esbuild: {
    // tsconfig 的 jsx: preserve 供 Next 使用；vitest 里转成 automatic runtime
    jsx: "automatic",
  },
});
