import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { loadSpec } from "@future-earth/spec";

const paramsFile = JSON.parse(readFileSync(new URL("../params.json", import.meta.url), "utf8"));

describe("校准产物", () => {
  it("params.json 存在、包含三阶段记录且参数在先验范围内", () => {
    expect(paramsFile.stages.map((s: { stage: string }) => s.stage)).toEqual(["carbon", "climate", "slr"]);
    for (const [id, v] of Object.entries(paramsFile.values as Record<string, number>)) {
      const def = loadSpec().parameters.find((x) => x.id === id)!;
      expect(v, id).toBeGreaterThanOrEqual(def.min);
      expect(v, id).toBeLessThanOrEqual(def.max);
    }
  });
});
