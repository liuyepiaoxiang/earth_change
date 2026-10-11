import { describe, it, expect } from "vitest";
import { loadSpec } from "./index.js";

describe("variables", () => {
  const spec = loadSpec();
  const varIds = new Set(spec.variables.map((v) => v.id));
  const domainIds = new Set(spec.ontology.domains.map((d) => d.id));

  it("变量数 = 58 且 id 唯一", () => {
    expect(spec.variables).toHaveLength(58);
    expect(varIds.size).toBe(58);
  });
  it("domain 字段必须指向本体域", () => {
    for (const v of spec.variables) expect(domainIds.has(v.domain), v.id).toBe(true);
  });
  it("drivers/affects 引用必须可解析", () => {
    for (const v of spec.variables) {
      for (const d of [...v.drivers, ...v.affects]) expect(varIds.has(d), `${v.id}→${d}`).toBe(true);
    }
  });
});
