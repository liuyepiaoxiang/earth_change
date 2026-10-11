import type { EquationId } from "@future-earth/spec";
import type { Params } from "./types.js";
import * as forcing from "./equations/forcing.js";
import * as carbon from "./equations/carbon.js";
import * as ocean from "./equations/ocean.js";
import * as sealevel from "./equations/sealevel.js";
import * as downscale from "./equations/downscale.js";

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
};
