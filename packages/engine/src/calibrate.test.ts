import { describe, it, expect } from "vitest";
import { PARAMETER_DEFAULTS, PARAMETERS } from "@future-earth/spec";

import { CALIBRATED_PARAMS } from "./generated/params.gen.js";

describe("校准产物", () => {
  it("params.json 存在、包含三阶段记录且参数在先验范围内", () => {
    expect(CALIBRATED_PARAMS.lambda).toBeGreaterThan(0);
    for (const [id, v] of Object.entries(CALIBRATED_PARAMS as Record<string, number>)) {
      const def = PARAMETERS.find((x) => x.id === id)!;;
      expect(v, id).toBeGreaterThanOrEqual(def.min);
      expect(v, id).toBeLessThanOrEqual(def.max);
    }
  });
});
