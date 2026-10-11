import { describe, it, expect } from "vitest";
import { loadSpec } from "./index.js";

describe("causal graph & datasets", () => {
  const spec = loadSpec();
  const varIds = new Set(spec.variables.map((v) => v.id));
  const eqIds = new Set(spec.equations.map((e) => e.id));

  it("因果边数量在 85~110 之间", () => {
    expect(spec.causal_graph.length).toBeGreaterThanOrEqual(85);
    expect(spec.causal_graph.length).toBeLessThanOrEqual(110);
  });
  it("边端点与方程引用必须可解析", () => {
    for (const e of spec.causal_graph) {
      expect(varIds.has(e.source), e.source).toBe(true);
      expect(varIds.has(e.target), e.target).toBe(true);
      if (e.equation) expect(eqIds.has(e.equation), e.equation).toBe(true);
    }
  });
  it("数据源 id 唯一且共 10 条", () => {
    const ids = spec.datasets.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(10);
  });
});
