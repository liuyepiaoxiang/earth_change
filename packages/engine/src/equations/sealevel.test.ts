import { describe, it, expect } from "vitest";
import type { Params } from "../types.js";
import { dSth, dSglacier, dSgris, dSais, seaLevelSum, seaLevelRate, fingerprintGRIS, fingerprintAIS, regionalSeaLevel, slrComponentsTotal } from "./sealevel.js";
const p = {
  lambda: 1.16, gamma_ocean: 0.73, c_s: 8.2, c_d: 105, k_thermal: 0.0045,
  k_glacier: 0.0005, amp_glacier: 1.5, g0_glacier: 0.4,
  b0_gris: 0.0002, b1_gris: 0.001, b2_gris: 0.0002, amp_gris: 2.0,
  c0_ais: 0.0001, c1_ais: 0.0002, lw_rate: 0.0003,
} as Params;
const s = { co2: 422, ts: 1.4, td: 0.8, sThermal: 0.1, sGlacier: 0.1, sGrIS: 0.02, sAIS: 0.015, sLandWater: 0.005, b: 550, w: 800, mPf: 1400, pTh: 0 };

describe("海平面方程", () => {
  it("eq_14: 表层暖于深层 → 热膨胀为正", () => {
    expect(dSth(1.4, 0.8, p)).toBeGreaterThan(0);
    expect(dSth(0.8, 1.4, p)).toBeLessThan(0);
  });
  it("eq_26: 冰川储量耗尽后速率归零（长期积分不超过 G0）", () => {
    let sg = 0;
    for (let i = 0; i < 10000; i++) sg += dSglacier(4, sg, p);
    expect(sg).toBeLessThanOrEqual(p.g0_glacier + 1e-9);
  });
  it("eq_27: 冰盖损失随温度单调加速", () => {
    expect(dSgris(2, p)).toBeGreaterThan(dSgris(1, p));
    expect(dSais(2, p)).toBeGreaterThan(dSais(1, p));
    expect(dSgris(1, p) + dSais(1, p)).toBeGreaterThan(0);
  });
  it("eq_31/32: 加总一致", () => {
    expect(seaLevelSum(s)).toBeCloseTo(0.24, 6);
    expect(seaLevelRate(s, p)).toBeGreaterThan(0);
  });
});

describe("eq_55: 海平面重力指纹（v4 诊断式）", () => {
  // 与实现同源的海洋面积权重（闭合门用）
  const NODES: Array<[number, number]> = [[-90,0.02],[-78,0.1],[-66,0.55],[-55,0.97],[-45,0.96],[-35,0.9],[-25,0.75],[-15,0.72],[-5,0.75],[5,0.76],[15,0.73],[25,0.65],[35,0.6],[45,0.52],[55,0.55],[65,0.35],[75,0.35],[85,0.92],[90,1.0]];
  const frac = (lat: number) => {
    for (let i = 1; i < NODES.length; i++) if (lat <= NODES[i]![0]) {
      const [l0, f0] = NODES[i - 1]!, [l1, f1] = NODES[i]!;
      return f0 + ((f1 - f0) * (lat - l0)) / (l1 - l0);
    }
    return NODES[NODES.length - 1]![1];
  };
  const oceanMean = (f: (lat: number) => number) => {
    let num = 0, den = 0;
    for (let lat = -90; lat <= 90; lat++) {
      const w = Math.cos((lat * Math.PI) / 180) * frac(lat);
      num += w * f(lat); den += w;
    }
    return num / den;
  };

  it("归一化闭合：⟨F_GRIS⟩_ocean = ⟨F_AIS⟩_ocean = 1（barystatic 守恒）", () => {
    expect(oceanMean(fingerprintGRIS)).toBeCloseTo(1, 9);
    expect(oceanMean(fingerprintAIS)).toBeCloseTo(1, 9);
  });
  it("物理形状：近场负值（海面下降）、远场放大 1.0–1.3（Mitrovica 量级）", () => {
    expect(fingerprintGRIS(72)).toBeLessThan(0); // 格陵兰近场
    expect(fingerprintAIS(-75)).toBeLessThan(0); // 南极近场
    expect(fingerprintGRIS(-30)).toBeGreaterThan(1); // 南半球远场
    expect(fingerprintGRIS(-30)).toBeLessThan(1.3);
    expect(fingerprintAIS(30)).toBeGreaterThan(1); // 北半球远场
    expect(fingerprintAIS(30)).toBeLessThan(1.3);
  });
  it("区域海平面守恒：海洋平均 η = 全球总上升（线性 ⇒ 精确闭合）", () => {
    const c = { thermal: 0.3, glacier: 0.15, gris: 0.08, ais: 0.06, landWater: 0.04 };
    expect(oceanMean((lat) => regionalSeaLevel(lat, c))).toBeCloseTo(slrComponentsTotal(c), 9);
  });
  it("远场城市高于全球均值、冰盖近场低于全球均值（指纹语义）", () => {
    const c = { thermal: 0.3, glacier: 0.15, gris: 0.08, ais: 0.06, landWater: 0.04 };
    const g = slrComponentsTotal(c);
    expect(regionalSeaLevel(1.35, c)).toBeGreaterThan(g); // 新加坡：两冰盖远场
    expect(regionalSeaLevel(64, c)).toBeLessThan(g); // 冰岛：GRIS 近场
  });
});
