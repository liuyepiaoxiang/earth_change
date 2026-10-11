import { useEffect, useState } from "react";
import type { ScenarioId, SimResult, McResult } from "@future-earth/engine";

export type SimResultWithUnc = Omit<SimResult, "schemaVersion"> & {
  schemaVersion: 1 | 2;
  uncertainty?: McResult;
};

// 引擎毫秒级出结果：按「情景 + 是否含不确定性」缓存，切回已跑过的组合零等待
const cache = new Map<string, Promise<SimResultWithUnc>>();

function loadSim(scenario: ScenarioId, uncertainty: boolean): Promise<SimResultWithUnc> {
  const key = `${scenario}::${uncertainty ? "mc" : "base"}`;
  let p: Promise<SimResultWithUnc> | undefined = cache.get(key);
  if (!p) {
    p = import("@future-earth/engine").then((eng) => {
      const sim = eng.runScenario(scenario, 2500);
      if (!uncertainty) return sim;
      // MC 约百次模拟（~1s），仅在用户显式开启时计算
      return { ...sim, schemaVersion: 2 as const, uncertainty: eng.runScenarioMc(scenario, 2500) };
    });
    cache.set(key, p);
  }
  return p;
}

export function useSimulation(
  scenario: ScenarioId,
  uncertainty = false,
): { sim: SimResultWithUnc | null; error: string | null } {
  const [state, setState] = useState<{ sim: SimResultWithUnc | null; error: string | null }>({
    sim: null,
    error: null,
  });
  useEffect(() => {
    let alive = true;
    // 同情景下追加/撤销不确定性时保留旧结果（MC 计算期间继续显示中心路径，避免闪回装载中）
    setState((s) => (s.sim && s.sim.scenario === scenario ? s : { sim: null, error: null }));
    loadSim(scenario, uncertainty).then(
      (sim) => {
        if (alive) setState({ sim, error: null });
      },
      (e: unknown) => {
        if (alive) setState({ sim: null, error: e instanceof Error ? e.message : String(e) });
      },
    );
    return () => {
      alive = false;
    };
  }, [scenario, uncertainty]);
  return state;
}

export interface MetricsSnapshot {
  year: number;
  tempAnomaly: number;
  co2: number;
  seaLevel: { total: number; thermal: number; glacier: number; iceSheet: number; landWater: number };
}

/** 指标序列载体（SimResult 或带 uncertainty 的扩展）共用的结构化子集 */
type SimLike = Pick<SimResult, "years" | "metrics">;

function snapshotAt(sim: SimLike, i: number, year: number): MetricsSnapshot {
  return {
    year,
    tempAnomaly: sim.metrics.tempAnomaly[i]!,
    co2: sim.metrics.co2[i]!,
    seaLevel: {
      total: sim.metrics.seaLevel.total[i]!,
      thermal: sim.metrics.seaLevel.thermal[i]!,
      glacier: sim.metrics.seaLevel.glacier[i]!,
      iceSheet: sim.metrics.seaLevel.iceSheet[i]!,
      landWater: sim.metrics.seaLevel.landWater[i]!,
    },
  };
}

/** 年份插值：区间内线性插值，越界钳制到端点 */
function valueAt(years: number[], vals: number[], year: number): number {
  const n = years.length;
  if (n === 0) return NaN;
  if (year <= years[0]!) return vals[0]!;
  if (year >= years[n - 1]!) return vals[n - 1]!;
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (years[mid]! < year) lo = mid;
    else hi = mid;
  }
  const y0 = years[lo]!;
  const y1 = years[hi]!;
  const t = y1 === y0 ? 0 : (year - y0) / (y1 - y0);
  return vals[lo]! + (vals[hi]! - vals[lo]!) * t;
}

/** 年份插值：区间内线性插值，越界钳制到端点；空序列返回 null */
export function metricsAt(sim: SimLike, year: number): MetricsSnapshot | null {
  const { years } = sim;
  const n = years.length;
  if (n === 0) return null;
  if (year <= years[0]!) return snapshotAt(sim, 0, years[0]!);
  if (year >= years[n - 1]!) return snapshotAt(sim, n - 1, years[n - 1]!);
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (years[mid]! < year) lo = mid;
    else hi = mid;
  }
  const y0 = years[lo]!;
  const y1 = years[hi]!;
  const t = y1 === y0 ? 0 : (year - y0) / (y1 - y0);
  const mix = (a: number, b: number) => a + (b - a) * t;
  const m = sim.metrics;
  return {
    year,
    tempAnomaly: mix(m.tempAnomaly[lo]!, m.tempAnomaly[hi]!),
    co2: mix(m.co2[lo]!, m.co2[hi]!),
    seaLevel: {
      total: mix(m.seaLevel.total[lo]!, m.seaLevel.total[hi]!),
      thermal: mix(m.seaLevel.thermal[lo]!, m.seaLevel.thermal[hi]!),
      glacier: mix(m.seaLevel.glacier[lo]!, m.seaLevel.glacier[hi]!),
      iceSheet: mix(m.seaLevel.iceSheet[lo]!, m.seaLevel.iceSheet[hi]!),
      landWater: mix(m.seaLevel.landWater[lo]!, m.seaLevel.landWater[hi]!),
    },
  };
}

export interface UncertaintySnapshot {
  tempP10: number;
  tempP90: number;
  co2P10: number;
  co2P90: number;
  slP10: number;
  slP90: number;
}

/** 当前年份的不确定性区间（与中心路径同插值方式）；无 uncertainty 块返回 null */
export function metricsUncAt(sim: SimResultWithUnc, year: number): UncertaintySnapshot | null {
  const u = sim.uncertainty;
  if (!u || u.years.length === 0) return null;
  return {
    tempP10: valueAt(u.years, u.tempAnomaly.p10, year),
    tempP90: valueAt(u.years, u.tempAnomaly.p90, year),
    co2P10: valueAt(u.years, u.co2.p10, year),
    co2P90: valueAt(u.years, u.co2.p90, year),
    slP10: valueAt(u.years, u.seaLevel.p10, year),
    slP90: valueAt(u.years, u.seaLevel.p90, year),
  };
}
