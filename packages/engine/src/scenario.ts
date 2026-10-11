import { loadEmissions, loadForcing, loadScenario } from "@future-earth/data";
import type { Drivers, EarthState } from "./types.js";

function interpSeries(years: number[], vals: number[], y: number): number {
  if (y <= years[0]!) return vals[0]!;
  if (y >= years.at(-1)!) return vals.at(-1)!;
  let i = 0;
  while (years[i + 1]! < y) i++;
  const t = (y - years[i]!) / (years[i + 1]! - years[i]!);
  return vals[i]! * (1 - t) + vals[i + 1]! * t;
}

/** 历史驱动 1850-2024（排放 + CH₄/N₂O/f_other） */
export function makeHistoricalDrivers(): (year: number) => Drivers {
  const e = loadEmissions(), f = loadForcing();
  const ey = e.map((r) => r.year), fy = f.map((r) => r.year);
  return (year) => ({
    year,
    efossil: interpSeries(ey, e.map((r) => r.efossil), year),
    eluluc: interpSeries(ey, e.map((r) => r.eluluc), year),
    ch4: interpSeries(fy, f.map((r) => r.ch4), year),
    n2o: interpSeries(fy, f.map((r) => r.n2o), year),
    fOther: interpSeries(fy, f.map((r) => r.fOther), year),
  });
}

/** 情景驱动 2025-2500（浓度驱动模式：CO₂ 走 Meinshausen 2020 浓度路径；排放序列保留供展示/诊断） */
export function makeScenarioDrivers(id: "ssp126" | "ssp245" | "ssp370" | "ssp585"): (year: number) => Drivers {
  const s = loadScenario(id);
  return (year) => ({
    year,
    efossil: interpSeries(s.years, s.efossil, year),
    eluluc: interpSeries(s.years, s.eluluc, year),
    ch4: interpSeries(s.years, s.ch4, year),
    n2o: interpSeries(s.years, s.n2o, year),
    fOther: interpSeries(s.years, s.fOther, year),
    prescribedCo2: interpSeries(s.years, s.co2Conc, year),
  });
}

/** 1850 年初始状态（CO₂ 取冰芯 1850 值；温度/海平面异常归零） */
export function initialState(co2_1850 = 285.2): EarthState {
  return { co2: co2_1850, ts: 0, td: 0, sThermal: 0, sGlacier: 0, sGrIS: 0, sAIS: 0, sLandWater: 0 };
}
