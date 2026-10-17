import { describe, it, expect } from "vitest";
import { runScenario } from "./index.js";
import { amocStatus, grgLosing, permafrostBomb, allTippingPoints } from "./tipping.js";
import { runLayeredUncertainty, DEFAULT_LAYERS } from "./uncertainty.js";

const ssp585 = runScenario("ssp585", 2500);
const ssp126 = runScenario("ssp126", 2500);

describe("V4.0 U-04/U-05 临界点诊断", () => {
  it("U-04：每个临界点有触发条件/范围/警告——AMOC", () => {
    const a = amocStatus(ssp585, 2500);
    expect(a.triggerCondition.length).toBeGreaterThan(5);
    expect(a.validRange.length).toBeGreaterThan(3);
    expect(a.name).toBe("AMOC 减弱");
    // ssp585 2500 ΔT ~10°C → 触发
    expect(a.triggered).toBe(true);
  });
  it("U-04：低情景不触发", () => {
    const a = amocStatus(ssp126, 2100);
    expect(a.triggered).toBe(false);
  });
  it("U-05：极端路径不被误判为发散（ssp585 2500 物理信号保持 true）", () => {
    for (const t of allTippingPoints(ssp585, 2500)) {
      expect(t.isPhysicalSignal).toBe(true); // dT < 10-12 → 物理
    }
  });
  it("三个临界点齐全", () => {
    expect(allTippingPoints(ssp585, 2100).length).toBe(3);
  });
});

describe("V4.0 U-01~U-03 分层不确定性", () => {
  const r1 = runLayeredUncertainty("ssp585", [2100], DEFAULT_LAYERS, { n: 20, seed: 42 });
  const r2 = runLayeredUncertainty("ssp585", [2100], DEFAULT_LAYERS, { n: 20, seed: 42 });

  it("U-01：同 seed 可复现", () => {
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
  it("U-02：独立开关——关闭参数层 → 无 parameterBand", () => {
    const noParam = runLayeredUncertainty("ssp585", [2100], { ...DEFAULT_LAYERS, parameter: false }, { n: 10 });
    expect(noParam.milestones[0]!.parameterBand).toBeUndefined();
    expect(noParam.milestones[0]!.scenarioBand).toBeDefined();
  });
  it("U-03：口径声明区分 MC vs AR6 共识", () => {
    expect(r1.interpretation).toContain("非 AR6 共识");
    expect(r1.interpretation).toContain("参数不确定性");
  });
  it("参数带与情景带量级合理", () => {
    const m = r1.milestones[0]!;
    expect(m.parameterBand!.p10).toBeLessThan(m.parameterBand!.p90);
    expect(m.scenarioBand!.min).toBeLessThan(m.scenarioBand!.max);
    // ssp585-only 情景带实际上来自四 SSP（不是单情景）
    expect(m.scenarioBand!.max).toBeGreaterThan(3); // 含 ssp585
  });
});
