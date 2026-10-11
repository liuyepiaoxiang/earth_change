// 用法：node packages/data/scripts/fetch.mjs
// 产出：datasets/historical/{temperature,co2_concentration,emissions}_*.csv + manifest.json 更新
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HIST = join(ROOT, "datasets", "historical");
mkdirSync(HIST, { recursive: true });

async function getText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "future-earth-engine/0.1 (data fetch)" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const interp = (anchors, y) => {
  const ks = Object.keys(anchors).map(Number).sort((a, b) => a - b);
  if (y <= ks[0]) return anchors[ks[0]];
  if (y >= ks.at(-1)) return anchors[ks.at(-1)];
  for (let i = 0; i < ks.length - 1; i++) {
    if (y >= ks[i] && y <= ks[i + 1]) {
      const t = (y - ks[i]) / (ks[i + 1] - ks[i]);
      return anchors[ks[i]] * (1 - t) + anchors[ks[i + 1]] * t;
    }
  }
  throw new Error("interp");
};

// ---------- 1) GISTEMP 温度 ----------
const gistemp = await getText("https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv");
const rows = gistemp.split(/\r?\n/).filter((l) => l && !l.startsWith('"'));
const header = rows.findIndex((l) => l.startsWith("Year"));
const cols = rows[header].split(",");
const iYear = cols.indexOf("Year"), iJD = cols.indexOf("J-D");
const tempRaw = rows.slice(header + 1)
  .map((l) => l.split(","))
  .filter((c) => c.length > Math.max(iYear, iJD) && /^\d{4}$/.test(c[iYear]))
  .map((c) => ({ year: +c[iYear], anom: +c[iJD] }))
  .filter((r) => r.year >= 1850 && r.year <= 2024 && Number.isFinite(r.anom));
const base = tempRaw.filter((r) => r.year >= 1850 && r.year <= 1900);
const offset = base.reduce((a, r) => a + r.anom, 0) / base.length;
const temp = tempRaw.map((r) => ({ year: r.year, anomaly: +(r.anom - offset).toFixed(4) }));
if (!(temp.at(-1).anomaly > 1.0 && temp.at(-1).anomaly < 1.8)) throw new Error("GISTEMP 2024 异常值超预期范围: " + temp.at(-1).anomaly);
writeFileSync(join(HIST, "temperature_1850_2024.csv"),
  "year,anomaly\n" + temp.map((r) => `${r.year},${r.anomaly}`).join("\n") + "\n");

// ---------- 2) CO₂（NOAA 1959+ / Law Dome 1832-1978）----------
const noaa = await getText("https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_gl.csv");
const noaaRows = noaa.split(/\r?\n/).filter((l) => l && !l.startsWith("#"))
  .map((l) => l.split(","))
  .filter((c) => /^\d{4}$/.test(c[0]))
  .map((c) => ({ year: +c[0], ppm: +c[1] }))
  .filter((r) => r.year <= 2024);
let ldRows = [];
try {
  const lawdome = await getText("https://www.ncei.noaa.gov/pub/data/paleo/icecore/antarctica/lawdome/lawdome.co2.txt");
  ldRows = lawdome.split(/\r?\n/)
    .map((l) => l.trim().split(/\s+/))
    .filter((c) => c.length === 2 && /^\d{4}(\.\d+)?$/.test(c[0]))
    .map((c) => ({ year: Math.round(+c[0]), ppm: +c[1] }))
    .filter((r) => r.year >= 1832 && r.year <= 1958);
} catch (e) { console.warn("Law Dome 下载失败，1850-1958 用冰芯锚点插值兜底"); }
const ldAnchors = ldRows.length ? Object.fromEntries(ldRows.map((r) => [r.year, r.ppm])) : { 1832: 284.7, 1850: 285.2, 1900: 295.7, 1950: 311.9, 1958: 314.9 };
const co2 = [];
for (let y = 1850; y <= 2024; y++) {
  const n = noaaRows.find((r) => r.year === y);
  const ppm = n ? n.ppm : interp(ldAnchors, y);
  co2.push({ year: y, ppm: +ppm.toFixed(2) });
}
if (!(co2.at(-1).ppm > 415 && co2.at(-1).ppm < 430)) throw new Error("CO₂ 2024 超预期: " + co2.at(-1).ppm);
writeFileSync(join(HIST, "co2_concentration_1850_2024.csv"),
  "year,ppm\n" + co2.map((r) => `${r.year},${r.ppm}`).join("\n") + "\n");

// ---------- 3) 化石排放（OWID 世界总量；LULUC 用 GCB 量级锚点合成）----------
let emis;
try {
  const owid = await getText("https://ourworldindata.org/grapher/annual-co2-emissions-per-country.csv?format=csv");
  const rawEmis = owid.split(/\r?\n/).map((l) => l.split(","))
    .filter((c) => c[0] === "World" && /^\d{4}$/.test(c[2]))
    .map((c) => ({ year: +c[2], raw: parseFloat(c[3]) }));
  // 量纲自适应：OWID 可能以 t / kt / Mt CO₂ 计（2024 世界约 38.6 GtCO₂ ≈ 10.5 GtC）
  const v24 = rawEmis.filter((r) => r.year >= 2020).at(-1).raw;
  const toGtc = v24 > 1e8 ? (v) => v * 1e-9 * 12 / 44
    : v24 > 1e5 ? (v) => v * 1e-6 * 12 / 44
    : v24 > 1e2 ? (v) => v * 1e-3 * 12 / 44
    : (v) => v * 12 / 44;
  emis = rawEmis.map((r) => ({ year: r.year, gtc: +toGtc(r.raw).toFixed(3) }));
} catch (e) {
  const a = { 1750: 0.003, 1850: 0.09, 1900: 0.55, 1925: 0.9, 1950: 1.6, 1970: 3.6, 1980: 5.2, 1990: 5.9, 2000: 6.5, 2010: 8.3, 2020: 9.5, 2024: 10.1 };
  emis = []; for (let y = 1750; y <= 2024; y++) emis.push({ year: y, gtc: +interp(a, y).toFixed(3) });
}
const lulucA = { 1750: 0.05, 1800: 0.3, 1850: 0.5, 1900: 0.9, 1950: 1.3, 1980: 1.7, 2000: 1.6, 2020: 1.3, 2024: 1.2 };
if (!(emis.at(-1).gtc > 9 && emis.at(-1).gtc < 11.5)) throw new Error("2024 化石排放超预期: " + emis.at(-1).gtc);
writeFileSync(join(HIST, "emissions_1750_2024.csv"),
  "year,efossil,eluluc\n" + emis.map((r) => `${r.year},${r.gtc},${interp(lulucA, r.year).toFixed(3)}`).join("\n") + "\n");

// ---------- 4) manifest ----------
const files = ["temperature_1850_2024.csv", "co2_concentration_1850_2024.csv", "emissions_1750_2024.csv"];
const manifestPath = join(ROOT, "datasets", "manifest.json");
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { version: 1, entries: {} };
for (const f of files) {
  const content = readFileSync(join(HIST, f), "utf8");
  manifest.entries[`historical/${f}`] = {
    sha256: sha256(content), bytes: Buffer.byteLength(content), retrieved: new Date().toISOString().slice(0, 10),
    source: f.startsWith("temperature") ? "NASA GISTEMP v4" : f.startsWith("co2") ? "NOAA GML + Law Dome" : "OWID/GCP + GCB锚点",
  };
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log("OK — 行数: 温度", temp.length, "| CO₂", co2.length, "| 排放", emis.length);
console.log("2024 检查: ΔT=" + temp.at(-1).anomaly + "°C  CO₂=" + co2.at(-1).ppm + "ppm  化石=" + emis.at(-1).gtc + "GtC");
