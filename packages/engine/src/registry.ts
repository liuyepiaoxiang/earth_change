import type { EquationId } from "@future-earth/spec";
import type { Params } from "./types.js";
import * as forcing from "./equations/forcing.js";
import * as carbon from "./equations/carbon.js";
import * as ocean from "./equations/ocean.js";
import * as sealevel from "./equations/sealevel.js";
import * as downscale from "./equations/downscale.js";
import * as seaice from "./equations/seaice.js";
import * as energy from "./equations/energy.js";
import * as singlelayer from "./equations/singlelayer.js";
import * as water from "./equations/water.js";
import * as bio from "./equations/bio.js";
import * as fire from "./equations/fire.js";
import * as permafrost from "./equations/permafrost.js";
import * as geo from "./equations/geo.js";

type EqFn = (...args: never[]) => unknown;

/** 方程 id → 可独立调用的纯函数实现（签名各异，一致性测试只校验存在性与可调用性） */
export const REGISTRY: Partial<Record<EquationId, EqFn>> = {
  eq_06: ((F: number, p: { lambda: number }) => F / p.lambda) as EqFn, // 平衡响应诊断 T_eq=F/λ
  eq_07: forcing.fCO2 as EqFn,
  eq_08: forcing.fGHG as EqFn,
  eq_09: forcing.fTotal as EqFn,
  eq_11: ocean.dTs as EqFn,
  eq_12: ocean.dTd as EqFn,
  eq_13: ocean.heatContent as EqFn,
  eq_14: sealevel.dSth as EqFn,
  eq_15: carbon.dCO2ppm as EqFn,
  eq_16: carbon.landSink as EqFn,
  eq_17: carbon.oceanSink as EqFn,
  eq_25: ((ts: number, sG: number, p: Params) => -sealevel.dSglacier(ts, sG, p)) as EqFn,
  eq_26: sealevel.dSglacier as EqFn,
  eq_27: sealevel.iceSheetRates as EqFn,
  eq_31: sealevel.seaLevelSum as EqFn,
  eq_32: sealevel.seaLevelRate as EqFn,
  eq_49: downscale.isLandAboveSea as EqFn,
  eq_50: downscale.classifyBiome as EqFn,
  eq_51: downscale.localDTs as EqFn,
  eq_52: downscale.scaledPrecip as EqFn,
  eq_53: downscale.isCityFlooded as EqFn,
  // 诊断式（v1.x 收尾批）：辐射能量收支，UI 直接调用，不接入 solver RHS
  eq_01: energy.qIn as EqFn,
  eq_02: energy.qRef as EqFn,
  eq_03: energy.qAbs as EqFn,
  eq_04: energy.qOut as EqFn,
  eq_05: energy.netRadiation as EqFn,
  eq_10: singlelayer.runSingleLayer as EqFn,
  // 诊断式（v1.x 收尾批）：水循环链
  eq_19: water.precipitation as EqFn,
  eq_20: water.evaporation as EqFn,
  eq_21: water.waterBalanceStep as EqFn,
  eq_22: water.runoff as EqFn,
  eq_23: water.soilWaterStep as EqFn,
  eq_24: water.snowStep as EqFn,
  // v2 生物圈（ADR-003）：植被动态与生物量收支
  eq_33: bio.growth as EqFn,
  eq_34: bio.death as EqFn,
  eq_35: bio.vegetationDdt as EqFn,
  eq_36: bio.npp as EqFn,
  eq_18: bio.biomassDdt as EqFn,
  // v2 火灾与冻土（ADR-003 异常口径）
  eq_37: fire.fireProbability as EqFn,
  eq_38: fire.fireFlux as EqFn,
  eq_39: permafrost.permafrostThaw as EqFn,
  eq_40: permafrost.permafrostRelease as EqFn,
  // v3 地貌演化诊断链
  eq_41: geo.slope as EqFn,
  eq_42: geo.riverErosion as EqFn,
  eq_43: geo.surfaceErosion as EqFn,
  eq_44: geo.vegetationShield as EqFn,
  eq_45: geo.sedimentBudget as EqFn,
  eq_46: geo.sedimentTransport as EqFn,
  eq_47: geo.elevationChange as EqFn,
  eq_48: geo.coastalErosion as EqFn,
  // 诊断式（ADR-001）：海冰与冰-反照率，UI 直接调用，不接入 solver RHS
  eq_28: seaice.seaIceArea as EqFn,
  eq_29: seaice.surfaceAlbedo as EqFn,
  eq_30: seaice.iceAlbedoFeedback as EqFn,
};
