import { describe, it, expect } from "vitest";
import { V0_EQUATIONS } from "@future-earth/spec";
import { REGISTRY } from "./registry.js";

describe("规格↔代码一致性（SPEC §4.3）", () => {
  it("所有 impl:v0 方程都已注册实现", () => {
    for (const id of V0_EQUATIONS) expect(REGISTRY[id], id).toBeDefined();
  });
  it("注册表无孤儿（所有注册 id 都在 v0 清单中）", () => {
    for (const id of Object.keys(REGISTRY)) expect(V0_EQUATIONS).toContain(id);
  });
  it("每个注册项可调用", () => {
    for (const [id, fn] of Object.entries(REGISTRY)) expect(typeof fn, id).toBe("function");
  });
});
