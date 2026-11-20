import { describe, it, expect } from "vitest";
import { ExperimentControlsSchema } from "@future-earth/engine";
import { PRESETS } from "./presets";

describe("A3 剧本预设", () => {
  it("四个预设全部通过引擎 zod schema（合法域守卫——引擎零改动的前提）", () => {
    expect(PRESETS).toHaveLength(4);
    for (const p of PRESETS) {
      const parsed = ExperimentControlsSchema.parse(p.controls);
      expect(parsed).toEqual(p.controls); // 不应有字段被 schema 静默改写
    }
  });

  it("预设方向语义：化石永动最激进（1.5×/最晚减排），极限急救最保守（0.5×/2030 净零）", () => {
    const fossil = PRESETS.find((p) => p.id === "fossil-forever")!;
    const brake = PRESETS.find((p) => p.id === "emergency-brake")!;
    expect(fossil.controls.emissionScale).toBe(1.5);
    expect(fossil.controls.declineStart).toBe(2100);
    expect(brake.controls.emissionScale).toBe(0.5);
    expect(brake.controls.netZeroYear).toBe(2030);
    for (const p of PRESETS) expect(p.controls.netZeroYear).toBeGreaterThan(p.controls.declineStart);
  });
});
