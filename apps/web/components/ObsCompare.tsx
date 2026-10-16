"use client";
/** V02：历史观测 vs 模型对照（GISTEMP 1880-2024） */
import { useMemo } from "react";
import { loadTemperature } from "@future-earth/data";
import Chart from "./Chart";
import type { SimResultWithUnc } from "../lib/sim";

export default function ObsCompare({ sim, markerX }: { sim: SimResultWithUnc; markerX?: number }) {
  const { years, model, obs } = useMemo(() => {
    const t = loadTemperature();
    const from = t[0]!.year, to = t.at(-1)!.year;
    const y: number[] = [], m: number[] = [], o: number[] = [];
    for (let yr = from; yr <= to; yr++) {
      const i = sim.years.indexOf(yr);
      const ob = t.find((r) => r.year === yr);
      if (i >= 0 && ob) { y.push(yr); m.push(sim.metrics.tempAnomaly[i]!); o.push(ob.anomaly); }
    }
    return { years: y, model: m, obs: o };
  }, [sim]);
  return (
    <Chart
      years={years} unit="°C（相对工业化前）" markerX={markerX}
      series={[
        { name: "模型", color: "#f87171", values: model },
        { name: "GISTEMP 观测", color: "#38bdf8", values: obs, dashed: true },
      ]}
    />
  );
}
