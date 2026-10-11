import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { z } from "zod";

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DS = join(PKG_ROOT, "datasets");

function readCsv(rel: string): string[][] {
  const lines = readFileSync(join(DS, rel), "utf8").trim().split(/\r?\n/);
  return lines.map((l) => l.split(","));
}
function checkManifest(rel: string) {
  const m = JSON.parse(readFileSync(join(DS, "manifest.json"), "utf8"));
  const e = (m.entries as Record<string, { sha256: string }>)[rel];
  if (!e) throw new Error(`manifest 缺少条目: ${rel}`);
  const content = readFileSync(join(DS, rel), "utf8");
  const h = createHash("sha256").update(content).digest("hex");
  if (h !== e.sha256) throw new Error(`校验和不匹配: ${rel}`);
}

const TempRow = z.object({ year: z.number().int(), anomaly: z.number() });
const Co2Row = z.object({ year: z.number().int(), ppm: z.number().positive() });
const EmisRow = z.object({ year: z.number().int(), efossil: z.number(), eluluc: z.number() });
const ForcingRow = z.object({ year: z.number().int(), ch4: z.number().positive(), n2o: z.number().positive(), fOther: z.number() });

function parseCsv<T>(rel: string, schema: z.ZodType<T>, map: (c: string[]) => unknown): T[] {
  checkManifest(rel);
  const rows = readCsv(rel).slice(1).map(map);
  return rows.map((r) => schema.parse(r));
}

export const loadTemperature = () => parseCsv("historical/temperature_1880_2024.csv", TempRow, (c) => ({ year: +c[0]!, anomaly: +c[1]! }));
export const loadCO2 = () => parseCsv("historical/co2_concentration_1850_2024.csv", Co2Row, (c) => ({ year: +c[0]!, ppm: +c[1]! }));
export const loadEmissions = () => parseCsv("historical/emissions_1750_2024.csv", EmisRow, (c) => ({ year: +c[0]!, efossil: +c[1]!, eluluc: +c[2]! }));
export const loadForcing = () => parseCsv("historical/forcing_natural_1850_2024.csv", ForcingRow, (c) => ({ year: +c[0]!, ch4: +c[1]!, n2o: +c[2]!, fOther: +c[3]! }));

export interface ScenarioSeries { id: string; name: string; years: number[]; efossil: number[]; eluluc: number[]; ch4: number[]; n2o: number[]; fOther: number[]; landWaterRate: number }
export function loadScenario(id: "ssp126" | "ssp245" | "ssp370" | "ssp585"): ScenarioSeries {
  const p = join(DS, "scenarios", `${id}.json`);
  if (!existsSync(p)) throw new Error(`情景文件不存在: ${id}（先运行 gen-forcing.mjs）`);
  return JSON.parse(readFileSync(p, "utf8")) as ScenarioSeries;
}
