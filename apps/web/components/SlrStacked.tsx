"use client";
/** V02：海平面四分量堆叠面积（分量 + 累计虚线） */
import Chart from "./Chart";
import { useI18n } from "../lib/i18n";
import type { SimResultWithUnc } from "../lib/sim";

export default function SlrStacked({ sim, markerX }: { sim: SimResultWithUnc; markerX?: number }) {
  const { locale } = useI18n();
  const en = locale === "en";
  const sl = sim.metrics.seaLevel;
  const cum = sl.thermal.map((_, i) => sl.thermal[i]! + sl.glacier[i]! + sl.iceSheet[i]! + sl.landWater[i]!);
  return (
    <Chart
      years={sim.years} unit={en ? "m (cumulative since 1850)" : "m（自 1850 累计）"} markerX={markerX}
      series={[
        { name: en ? "Thermal expansion" : "热膨胀", color: "#38bdf8", values: sl.thermal },
        { name: en ? "Glaciers" : "冰川", color: "#67e8f9", values: sl.glacier },
        { name: en ? "Ice sheets" : "冰盖", color: "#a5b4fc", values: sl.iceSheet },
        { name: en ? "Land water" : "陆地水", color: "#94a3b8", values: sl.landWater },
        { name: en ? "Total" : "合计", color: "#fbbf24", values: cum, dashed: true },
      ]}
    />
  );
}
