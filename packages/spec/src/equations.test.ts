import { describe, it, expect } from "vitest";
import { loadSpec } from "./index.js";

describe("equations", () => {
  const spec = loadSpec();
  const varIds = new Set(spec.variables.map((v) => v.id));
  const paramIds = new Set(spec.parameters.map((p) => p.id));

  it("方程数 = 53 且 id 唯一且为 eq_01..eq_53", () => {
    expect(spec.equations).toHaveLength(53);
    const ids = spec.equations.map((e) => e.id);
    expect(new Set(ids).size).toBe(53);
    expect(ids).toEqual(Array.from({ length: 53 }, (_, i) => `eq_${String(i + 1).padStart(2, "0")}`));
  });
  it("inputs/outputs 引用的变量必须存在", () => {
    for (const e of spec.equations)
      for (const v of [...e.inputs, ...e.outputs]) expect(varIds.has(v), `${e.id}:${v}`).toBe(true);
  });
  it("引用的参数必须在 parameters.yaml 中定义", () => {
    for (const e of spec.equations)
      for (const p of e.parameters) expect(paramIds.has(p), `${e.id}:${p}`).toBe(true);
  });
});
