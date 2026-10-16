/** V02-E05 时间外推稳定性检查：返回告警列表（空 = 通过） */
import type { YearRecord } from "./types.js";

export function checkStability(records: YearRecord[], g0Glacier = 0.45): string[] {
  const warn: string[] = [];
  let prevT: number | null = null;
  for (const r of records) {
    const vals = [r.co2, r.tempAnomaly, r.oceanDeep, r.seaLevel, r.biomass, r.soilMoisture, r.permafrost];
    if (vals.some((v) => !Number.isFinite(v))) { warn.push(`数值发散：${r.year} 出现 NaN/Inf`); break; }
    if (r.co2 <= 150 || r.co2 >= 10000) { warn.push(`CO₂ 越界（${r.year}: ${r.co2.toFixed(0)} ppm）`); break; }
    if (prevT !== null && Math.abs(r.tempAnomaly - prevT) > 0.5) { warn.push(`温度年际跳变异常（${r.year}: ${(r.tempAnomaly - prevT).toFixed(2)} K/yr）`); break; }
    if (r.permafrost < -1e-9) { warn.push(`冻土碳库为负（${r.year}）`); break; }
    if (r.slGlacier > g0Glacier + 1e-6) { warn.push(`冰川贡献超过总储量 G0（${r.year}）`); break; }
    if (r.biomass < -1e-9) { warn.push(`生物量为负（${r.year}）`); break; }
    if (r.soilMoisture < -1e-9) { warn.push(`土壤水分为负（${r.year}）`); break; }
    prevT = r.tempAnomaly;
  }
  return warn;
}
