// 用法：node packages/data/scripts/gen-forcing.mjs
// 从 spec 的 scenarios.yaml 与内置锚点表生成 forcing_natural.csv 和 ssp*.json
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { parse } from "yaml";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "datasets");
const SPEC = join(dirname(fileURLToPath(import.meta.url)), "../../spec/src/spec");
const interp = (anchors, y) => {
  const ks = Object.keys(anchors).map(Number).sort((a, b) => a - b);
  if (y <= ks[0]) return anchors[ks[0]];
  if (y >= ks.at(-1)) return anchors[ks.at(-1)];
  const i = ks.findIndex((k) => k >= y) - 1;
  const t = (y - ks[i]) / (ks[i + 1] - ks[i]);
  return anchors[ks[i]] * (1 - t) + anchors[ks[i + 1]] * t;
};
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ---- 历史 f_other 锚点（火山脉冲 + 气溶胶基线；AR6 量级）----
const fOtherA = {
  1850: -0.12, 1883: -0.12, 1884: -2.30, 1885: -1.00, 1886: -0.28, 1900: -0.16, 1912: -0.40,
  1913: -0.30, 1930: -0.22, 1950: -0.36, 1963: -0.90, 1964: -0.30, 1970: -0.42, 1980: -0.50,
  1982: -1.05, 1983: -0.35, 1985: -0.55, 1990: -0.62, 1991: -0.72, 1992: -2.20, 1993: -0.82,
  1994: -0.42, 2000: -0.82, 2010: -0.70, 2015: -0.58, 2020: -0.53, 2024: -0.50,
};
// ---- 历史 CH₄/N₂O 浓度锚点（ppb；冰芯+现代观测量级）----
const ch4A = { 1850: 800, 1900: 930, 1950: 1160, 1970: 1420, 1990: 1710, 2000: 1770, 2010: 1800, 2020: 1890, 2024: 1930 };
const n2oA = { 1850: 272, 1900: 274, 1950: 289, 1975: 303, 2000: 317, 2010: 324, 2020: 333, 2024: 337 };

const histCsv = ["year,ch4,n2o,f_other", ...range(1850, 2024).map((y) =>
  `${y},${interp(ch4A, y).toFixed(1)},${interp(n2oA, y).toFixed(1)},${interp(fOtherA, y).toFixed(3)}`)].join("\n") + "\n";
writeFileSync(join(DATA, "historical", "forcing_natural_1850_2024.csv"), histCsv);

// ---- 情景 JSON（从 spec scenarios.yaml 展开）----
const scenarios = parse(readFileSync(join(SPEC, "scenarios.yaml"), "utf8"));
mkdirSync(join(DATA, "scenarios"), { recursive: true });
for (const s of scenarios) {
  const years = range(2025, 2500);
  const out = {
    id: s.id, name: s.name,
    years,
    efossil: years.map((y) => +interp(s.co2_emission_anchors_gtc, y).toFixed(3)),
    eluluc: years.map((y) => +interp(s.luluc_anchors_gtc, y).toFixed(3)),
    ch4: years.map((y) => +interp(s.ch4_anchors_ppb, y).toFixed(0)),
    n2o: years.map((y) => +interp(s.n2o_anchors_ppb, y).toFixed(0)),
    fOther: years.map((y) => +interp(s.f_other_anchors_wm2, y).toFixed(3)),
    co2Conc: years.map((y) => +interp(s.co2_conc_anchors_ppm, y).toFixed(1)),
    landWaterRate: s.land_water_rate_m_yr,
  };
  writeFileSync(join(DATA, "scenarios", `${s.id}.json`), JSON.stringify(out) + "\n");
  console.log(`scenario ${s.id}: 2100 化石排放 = ${out.efossil[years.indexOf(2100)]} GtC/yr`);
}

// ---- manifest 追加生成物 ----
const mp = join(DATA, "manifest.json");
const m = JSON.parse(readFileSync(mp, "utf8"));
const files = ["historical/forcing_natural_1850_2024.csv", "scenarios/ssp126.json", "scenarios/ssp245.json", "scenarios/ssp370.json", "scenarios/ssp585.json"];
for (const f of files) {
  const c = readFileSync(join(DATA, f), "utf8");
  m.entries[f] = { sha256: createHash("sha256").update(c).digest("hex"), bytes: Buffer.byteLength(c), retrieved: new Date().toISOString().slice(0, 10), source: "gen-forcing 合成（AR6/Riahi/Meinshausen 锚点）" };
}
writeFileSync(mp, JSON.stringify(m, null, 2) + "\n");
console.log("OK");
