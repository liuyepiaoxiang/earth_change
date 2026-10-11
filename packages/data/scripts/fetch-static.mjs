// 用法：node packages/data/scripts/fetch-static.mjs
// 产出: static/cities_top500.csv（GeoNames + WorldClim 基准气候）+ static/warming_pattern_lat.csv（GISTEMP 分带回归）
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import * as GeoTIFF from "geotiff";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "datasets");
const TMP = join(DATA, "_tmp");
const STATIC = join(DATA, "static");
mkdirSync(STATIC, { recursive: true });
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
async function dl(url, file) {
  const res = await fetch(url, { headers: { "User-Agent": "future-earth-engine/0.1" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { writeFileSync: wf } = await import("node:fs");
  wf(file, buf);
  return buf.length;
}
const unzip = (zip, dest) => execSync(`powershell -NoProfile -Command "Expand-Archive -Force -LiteralPath '${zip}' -DestinationPath '${dest}'"`, { stdio: "ignore" });

// ---------- 1) GeoNames 城市 ----------
const zipFile = join(TMP, "cities15000.zip");
if (!existsSync(zipFile)) { mkdirSync(TMP, { recursive: true }); await dl("https://download.geonames.org/export/dump/cities15000.zip", zipFile); }
unzip(zipFile, TMP);
const lines = readFileSync(join(TMP, "cities15000.txt"), "utf8").split(/\r?\n/);
const cities = lines.filter(Boolean).map((l) => l.split("\t"))
  .map((c) => ({ name: c[1], country: c[8], lat: +c[4], lon: +c[5], elevation: +c[15] || 0, population: +c[14] || 0 }))
  .filter((c) => c.population > 0)
  .sort((a, b) => b.population - a.population)
  .slice(0, 500);
console.log(`GeoNames: top ${cities.length} 城市`);

// ---------- 2) WorldClim 基准气候（每张 tif 一次性载入内存，之后 O(1) 采样） ----------
const gridCache = new Map();
async function loadGrid(zipName, prefix, m) {
  const key = `${prefix}${m}`;
  if (gridCache.has(key)) return gridCache.get(key);
  let f = join(TMP, `${prefix}_${String(m).padStart(2, "0")}.tif`);
  if (!existsSync(f)) f = join(TMP, "wc_" + prefix, `${prefix}_${String(m).padStart(2, "0")}.tif`);
  if (!existsSync(f)) {
    const zip = join(TMP, zipName);
    if (!existsSync(zip)) { mkdirSync(TMP, { recursive: true }); await dl(`https://geodata.ucdavis.edu/climate/worldclim/2_1/base/${zipName}`, zip); }
    unzip(zip, join(TMP, "wc_" + prefix));
    if (!existsSync(f)) f = join(TMP, "wc_" + prefix, `${prefix}_${String(m).padStart(2, "0")}.tif`);
  }
  const tif = await GeoTIFF.fromFile(f);
  const img = await tif.getImage();
  const data = (await img.readRasters())[0];
  const w = img.getWidth(), h = img.getHeight();
  const [ox, oy] = img.getOrigin();
  const [rx, ry] = img.getResolution ? img.getResolution() : [360 / w, -360 / h];
  const grid = { data, w, h, ox, oy, rx, ry };
  gridCache.set(key, grid);
  return grid;
}
function sampleGrid(grid, lat, lon) {
  const px = Math.min(grid.w - 1, Math.max(0, Math.floor((lon - grid.ox) / grid.rx)));
  const py = Math.min(grid.h - 1, Math.max(0, Math.floor((grid.oy - lat) / -grid.ry)));
  return grid.data[py * grid.w + px];
}
const tavgGrids = [], precGrids = [];
for (let m = 1; m <= 12; m++) {
  tavgGrids.push(await loadGrid("wc2.1_10m_tavg.zip", "wc2.1_10m_tavg", m));
  precGrids.push(await loadGrid("wc2.1_10m_prec.zip", "wc2.1_10m_prec", m));
  console.log(`  网格载入 ${m}/12`);
}
for (const c of cities) {
  try {
    let t = 0, p = 0;
    for (let m = 0; m < 12; m++) { t += sampleGrid(tavgGrids[m], c.lat, c.lon); p += sampleGrid(precGrids[m], c.lat, c.lon); }
    c.tbase = +(t / 12).toFixed(2);
    c.pbase = +p.toFixed(0);
  } catch (e) { c.tbase = NaN; c.pbase = NaN; }
}
gridCache.clear();
const ok = cities.filter((c) => Number.isFinite(c.tbase));
console.log(`WorldClim: ${ok.length}/${cities.length} 城市成功`);
writeFileSync(join(STATIC, "cities_top500.csv"),
  "name,country,lat,lon,elevation,population,tbase,pbase\n" +
  ok.map((c) => `${c.name.replace(/,/g, " ")},${c.country},${c.lat},${c.lon},${c.elevation},${c.population},${c.tbase},${c.pbase}`).join("\n") + "\n");
console.log(`cities_top500.csv: ${ok.length} 行`);
// ---------- 3) GISTEMP 纬度带升温模式（分带 vs 全球 回归 1960-2024） ----------
const zon = await (await fetch("https://data.giss.nasa.gov/gistemp/tabledata_v4/ZonAnn.Ts+dSST.csv", { headers: { "User-Agent": "fe/0.1" } })).text();
const rows = zon.split(/\r?\n/);
const hdr = rows.findIndex((l) => l.startsWith("Year"));
const cols = rows[hdr].split(",");
const iY = cols.indexOf("Year"), iG = cols.indexOf("Glob");
const FINE_BANDS = { "64N-90N": [64, 90], "44N-64N": [44, 64], "24N-44N": [24, 44], "EQU-24N": [0, 24], "24S-EQU": [-24, 0], "44S-24S": [-44, -24], "64S-44S": [-64, -44], "90S-64S": [-90, -64] };
const bands = cols.map((c, i) => ({ col: c.trim(), i })).filter((b) => FINE_BANDS[b.col] !== undefined);
if (bands.length < 8) throw new Error("ZonAnn 细分带列名不匹配: " + cols.join(","));
const dataRows = rows.slice(hdr + 1).map((l) => l.split(",")).filter((c) => /^\d{4}$/.test(c[iY]));
const bandRange = FINE_BANDS;
const pat = ["latMin,latMax,amp\n"];
for (const b of bands) {
  let sx = 0, sy = 0, sxx = 0, sxy = 0, n = 0;
  for (const c of dataRows) {
    const y = +c[iY]; if (y < 1960 || y > 2024) continue;
    const g = +c[iG], v = +c[b.i];
    if (!Number.isFinite(g) || !Number.isFinite(v)) continue;
    sx += g; sy += v; sxx += g * g; sxy += g * v; n++;
  }
  const amp = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const range = bandRange[b.col];
  if (range) pat.push(`${range[0]},${range[1]},${amp.toFixed(3)}\n`);
}
writeFileSync(join(STATIC, "warming_pattern_lat.csv"), pat.join(""));
console.log("warming_pattern:", pat.slice(1).join("").trim().split("\n").join(" | "));

// ---------- 4) manifest + 清理 ----------
const mp = join(DATA, "manifest.json");
const m = JSON.parse(readFileSync(mp, "utf8"));
for (const f of ["static/cities_top500.csv", "static/warming_pattern_lat.csv"]) {
  const c = readFileSync(join(DATA, f), "utf8");
  m.entries[f] = { sha256: sha256(c), bytes: Buffer.byteLength(c), retrieved: new Date().toISOString().slice(0, 10), source: f.includes("cities") ? "GeoNames + WorldClim 2.1" : "GISTEMP ZonAnn 回归" };
}
writeFileSync(mp, JSON.stringify(m, null, 2) + "\n");
rmSync(TMP, { recursive: true, force: true });
console.log("OK static");
