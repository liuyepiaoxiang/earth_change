import { useEffect, useState } from "react";
import type { ScenarioId, SimResult } from "@future-earth/engine";

// 引擎毫秒级出结果：按情景缓存 SimResult，切回已跑过的情景零等待
const cache = new Map<ScenarioId, Promise<SimResult>>();

function loadSim(scenario: ScenarioId): Promise<SimResult> {
  let p = cache.get(scenario);
  if (!p) {
    p = import("@future-earth/engine").then((eng) => eng.runScenario(scenario, 2500));
    cache.set(scenario, p);
  }
  return p;
}

export function useSimulation(scenario: ScenarioId): { sim: SimResult | null; error: string | null } {
  const [state, setState] = useState<{ sim: SimResult | null; error: string | null }>({ sim: null, error: null });
  useEffect(() => {
    let alive = true;
    setState({ sim: null, error: null });
    loadSim(scenario).then(
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
  }, [scenario]);
  return state;
}

export interface MetricsSnapshot {
  year: number;
  tempAnomaly: number;
  co2: number;
  seaLevel: { total: number; thermal: number; glacier: number; iceSheet: number; landWater: number };
}

function snapshotAt(sim: SimResult, i: number, year: number): MetricsSnapshot {
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

/** 年份插值：区间内线性插值，越界钳制到端点；空序列返回 null */
export function metricsAt(sim: SimResult, year: number): MetricsSnapshot | null {
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
