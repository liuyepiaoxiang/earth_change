import { describe, it, expect } from "vitest";
import { loadSpec } from "./index.js";

describe("spec bundle", () => {
  it("加载并通过 zod 校验", () => {
    const spec = loadSpec();
    expect(spec.ontology.domains).toHaveLength(10);
  });
  it("域 id 唯一", () => {
    const ids = loadSpec().ontology.domains.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
