import { describe, it, expect } from "vitest";
import { loadSpec } from "./index.js";
import { V0_EQUATIONS, V0_EQUATION_COUNT, type EquationId } from "./generated/spec-types.js";

describe("spec 内部一致性", () => {
  const spec = loadSpec();

  it("生成类型与 YAML 同步（v0 数量一致）", () => {
    const yamlV0 = spec.equations.filter((e) => e.impl === "v0").map((e) => e.id).sort();
    expect([...V0_EQUATIONS].sort()).toEqual(yamlV0);
    expect(V0_EQUATION_COUNT).toBe(yamlV0.length);
  });
  it("方程编号连续覆盖 eq_01..eq_53", () => {
    expect(spec.equations.map((e) => e.id)).toEqual(
      Array.from({ length: 53 }, (_, i) => `eq_${String(i + 1).padStart(2, "0")}` as EquationId),
    );
  });
  it("每个状态变量的 equations 字段引用的方程都存在，且 v0 方程的 outputs 覆盖了对应变量", () => {
    const eqIds = new Set(spec.equations.map((e) => e.id));
    for (const v of spec.variables)
      for (const eq of v.equations) expect(eqIds.has(eq), `${v.id}→${eq}`).toBe(true);
    for (const eq of spec.equations.filter((e) => e.impl === "v0"))
      for (const out of eq.outputs) {
        const v = spec.variables.find((x) => x.id === out)!;
        expect(v.impl === "v0" || !v.state_variable, `${eq.id} 输出 ${out} 应为 v0 或非状态变量`).toBe(true);
      }
  });
});
