import { describe, it, expect } from "vitest";
import { loadSpec } from "./load-spec.js";

describe("parameters", () => {
  it("v0 参数默认值都在先验范围内", () => {
    for (const p of loadSpec().parameters) {
      if (p.impl !== "v0") continue;
      expect(p.default, p.id).toBeGreaterThanOrEqual(p.min);
      expect(p.default, p.id).toBeLessThanOrEqual(p.max);
    }
  });
  it("id 唯一", () => {
    const ids = loadSpec().parameters.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
