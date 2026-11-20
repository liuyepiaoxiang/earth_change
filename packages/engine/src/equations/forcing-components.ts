/** 辐射强迫分量分解（eq_09 显式化，v4，docs/09 §2.1 高置信项 + G7 闭合门）。
 *  设计（G7）：全部分量之和恒等于引擎总量 F_total——
 *  CO₂/CH₄/N₂O 用引擎精确式（eq_07/08）；平流层水汽 = 6%×F_CH4（AR6 关系）；
 *  臭氧/航空用 AR6 2019 锚点按 CH₄ 浓度路径增长缩放；
 *  火山/太阳由 fOther 驱动数据承载（历史序列已含），**气溶胶+土地利用为残差项**
 *  吸收全部未建模分量，保证 Σ 闭合。
 *  诊断口径（ADR-001）：不接入 solver RHS，仅供 UI 分解条形图与 G7 门。 */
import * as forcing from "./forcing.js";
import type { Params } from "../types.js";

export interface ForcingBreakdown {
  co2: number;
  ch4: number;
  n2o: number;
  stratH2O: number; // 平流层水汽（≈6% of F_CH4，AR6 关系）
  ozone: number; // 对流层臭氧（AR6 2019 锚点 0.47 W/m² 按 CH₄ 路径缩放）
  aviation: number; // 航空尾迹（AR6 2019 锚点 0.06 W/m² 同比缩放）
  volcanic: number; // 由 fOther 驱动数据承载（历史序列已含），报 0 并注记
  solar: number; // 同上
  aerosolLuc: number; // 气溶胶+土地利用+残差（闭合项）
  total: number; // 引擎 F_total（Σ 分量恒等于此）
}

/** AR6 2019 年锚点（W/m²，Table 7.8 量级）与工业化前 CH₄ 基线 */
const O3_ANCHOR = 0.47;
const AVIATION_ANCHOR = 0.06;
const STRAT_H2O_FRAC = 0.06; // 平流层水汽 ≈ CH₄ 强迫的 6%
const CH4_2019 = 1866; // ppb，2019 年观测（锚点缩放分母基准）

/**
 * 强迫分量分解。输入与 rhs 同口径：co2/ch4/n2o 浓度、fOther 合并驱动（火山+太阳+
 * 气溶胶+LUC）、ch4Forcing 为 eq_08 拆出的 CH₄ 分量。恒等式：Σ 分量 === total。
 */
export function forcingBreakdown(
  co2: number,
  ch4: number,
  n2o: number,
  fOther: number,
  ch4Forcing: number,
  p: Params,
): ForcingBreakdown {
  const fCo2 = forcing.fCO2(co2, p);
  const fCh4 = ch4Forcing;
  const fN2O = forcing.fN2O(n2o, p);
  // 平流层水汽与 CH₄ 强迫成比例；臭氧/航空按 CH₄ 浓度路径增长缩放（工业化前→2019 锚点）
  const stratH2O = STRAT_H2O_FRAC * fCh4;
  const scale = Math.max(0, (ch4 - p.ch4_ref) / (CH4_2019 - p.ch4_ref));
  const ozone = O3_ANCHOR * scale;
  const aviation = AVIATION_ANCHOR * scale;
  // 残差闭合项：火山+太阳+气溶胶+LUC 全部吸收（fOther 本就是合并 ERF）
  const otherResidual = fOther - stratH2O - ozone - aviation;
  const total = forcing.fGHG(co2, ch4, n2o, p) + fOther;
  return {
    co2: fCo2,
    ch4: fCh4,
    n2o: fN2O,
    stratH2O,
    ozone,
    aviation,
    volcanic: 0,
    solar: 0,
    aerosolLuc: otherResidual,
    total,
  };
}
