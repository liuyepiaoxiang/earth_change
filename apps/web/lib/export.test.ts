import { describe, it, expect } from "vitest";

describe("export（node 环境仅校验纯逻辑入口可导入）", () => {
  it("模块可导入且不依赖 DOM 顶层执行", async () => {
    const mod = await import("./export.js");
    expect(typeof mod.exportCsv).toBe("function");
    expect(typeof mod.copyShareUrl).toBe("function");
  });
});
