// 用法：node packages/data/scripts/gen-bundle.mjs
// 把 CSV/JSON 数据固化为 TS 模块（src/generated/datasets.gen.ts），使引擎可打包进浏览器/serverless
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "datasets");
const read = (rel) => readFileSync(join(DATA, rel), "utf8");
const csv = (rel) => read(rel).trim().split(/\r?\n/).slice(1).map((l) => l.split(","));

const temperature = csv("historical/temperature_1880_2024.csv").map((c) => ({ year: +c[0], anomaly: +c[1] }));
const co2 = csv("historical/co2_concentration_1850_2024.csv").map((c) => ({ year: +c[0], ppm: +c[1] }));
const emissions = csv("historical/emissions_1750_2024.csv").map((c) => ({ year: +c[0], efossil: +c[1], eluluc: +c[2] }));
const forcing = csv("historical/forcing_natural_1850_2024.csv").map((c) => ({ year: +c[0], ch4: +c[1], n2o: +c[2], fOther: +c[3] }));
const scenarios = ["ssp126", "ssp245", "ssp370", "ssp585"].map((id) => JSON.parse(read(`scenarios/${id}.json`)));
const cities = [];
try {
  // 高程后备：GeoNames 高程 0/空 → 从 2.5° 网格高程采样（防止数据重抓后退回 bug）
  const gridPath = join(DATA, "../src/generated/grid.gen.ts");
  let gridElev = null;
  try { gridElev = JSON.parse(read("../src/generated/grid.gen.ts").match(/GRID_ELEV = (\[[\s\S]*?\]);/)[1]); } catch {}
  const cellElev = (lat, lon) => {
    if (!gridElev) return 50;
    const r = Math.min(71, Math.max(0, Math.floor((90 - lat) / 2.5)));
    const c = Math.min(143, Math.max(0, Math.floor((lon + 180) / 2.5)));
    return gridElev[r * 144 + c] ?? 50;
  };
  const cl = csv("static/cities_top500.csv");
  for (const c of cl) {
    const rawElev = +c[4];
    const elevation = rawElev <= 0 ? Math.round(cellElev(+c[2], +c[3])) : rawElev;
    const elevationSource = rawElev <= 0 ? "grid-fallback" : (c[5] || "geonames");
    cities.push({ name: c[0], country: c[1], lat: +c[2], lon: +c[3], elevation, elevationSource, population: +c[6], tbase: +c[7], pbase: +c[8] });
  }
  const fallbackCount = cities.filter((c,i) => +cl[i][4] <= 0).length;
  if (fallbackCount > 0) console.log(`  高程后备：${fallbackCount} 城使用网格高程`);
} catch {}
let pattern = [];
try {
  for (const c of csv("static/warming_pattern_lat.csv")) pattern.push({ latMin: +c[0], latMax: +c[1], amp: +c[2] });
} catch {}

const manifest = JSON.parse(read("manifest.json"));
const manifestHash = createHash("sha256").update(
  JSON.stringify(Object.keys(manifest.entries).sort().map((k) => [k, manifest.entries[k].sha256]))
).digest("hex").slice(0, 16);
const ts = `// 自动生成：node packages/data/scripts/gen-bundle.mjs —— 请勿手改
export const TEMPERATURE = ${JSON.stringify(temperature)} as const;
export const CO2 = ${JSON.stringify(co2)} as const;
export const EMISSIONS = ${JSON.stringify(emissions)} as const;
export const FORCING = ${JSON.stringify(forcing)} as const;
export const SCENARIOS = ${JSON.stringify(scenarios)} as const;
export const CITIES = ${JSON.stringify(cities)} as const;
export const WARMING_PATTERN = ${JSON.stringify(pattern)} as const;
export const MANIFEST_HASH = ${JSON.stringify(manifestHash)};
`;
const out = join(DATA, "../src/generated/datasets.gen.ts");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, ts, "utf8");
for (const rel of ["../src/generated/datasets.gen.ts"]) {
  manifest.entries["generated/datasets.gen.ts"] = { sha256: createHash("sha256").update(ts).digest("hex"), bytes: Buffer.byteLength(ts), retrieved: new Date().toISOString().slice(0, 10), source: "gen-bundle 固化" };
}
writeFileSync(join(DATA, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`OK datasets.gen.ts (${(Buffer.byteLength(ts) / 1024).toFixed(0)} KB, cities=${cities.length}, pattern=${pattern.length})`);
