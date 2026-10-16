"use client";
/** V02：海平面四分量堆叠面积（分量 + 累计虚线） */
import Chart from "./Chart";
import type { SimResultWithUnc } from "../lib/sim";

export default function SlrStacked({ sim, markerX }: { sim: SimResultWithUnc; markerX?: number }) {
  const sl = sim.metrics.seaLevel;
  const cum = sl.thermal.map((_, i) => sl.thermal[i]! + sl.glacier[i]! + sl.iceSheet[i]! + sl.landWater[i]!);
  return (
    <Chart
      years={sim.years} unit="m（自 1850 累计）" markerX={markerX}
      series={[
        { name: "热膨胀", color: "#38bdf8", values: sl.thermal },
        { name: "冰川", color: "#67e8f9", values: sl.glacier },
        { name: "冰盖", color: "#a5b4fc", values: sl.iceSheet },
        { name: "陆地水", color: "#94a3b8", values: sl.landWater },
        { name: "合计", color: "#fbbf24", values: cum, dashed: true },
      ]}
    />
  );
}
