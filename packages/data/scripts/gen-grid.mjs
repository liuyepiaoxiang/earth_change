// 用法：node packages/data/scripts/gen-grid.mjs（需联网下载 WorldClim tavg）
// V10-D01/D02：tavg(下载) + elevation/precip_5min.png(资产) → 2.5° 基准气候网格 → grid.gen.ts
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { PNG } from "pngjs";
import * as GeoTIFF from "geotiff";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "datasets");
const TMP = join(DATA, "_tmp");
const NLAT = 72, NLON = 144, RES = 2.5;

async function loadTavg(m) {
  const name = `wc2.1_10m_tavg_${String(m).padStart(2, "0")}.tif`;
  let path = join(TMP, name);
  if (!existsSync(path)) path = join(TMP, "wc_tavg", name);
  if (!existsSync(path)) {
    const zip = join(TMP, "wc2.1_10m_tavg.zip");
    if (!existsSync(zip)) {
      mkdirSync(TMP, { recursive: true });
      const res = await fetch("https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_10m_tavg.zip",
        { headers: { "User-Agent": "future-earth-engine/1.0" } });
      if (!res.ok) throw new Error(`${res.status} tavg.zip`);
      writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
    }
    execSync(`powershell -NoProfile -Command "Expand-Archive -Force -LiteralPath '${zip}' -DestinationPath '${join(TMP, "wc_tavg")}'"`, { stdio: "ignore" });
    path = existsSync(join(TMP, name)) ? join(TMP, name) : join(TMP, "wc_tavg", name);
  }
  const tif = await GeoTIFF.fromFile(path);
  const img = await tif.getImage();
  const data = (await img.readRasters())[0];
  const w = img.getWidth(), h = img.getHeight();
  const [ox, oy] = img.getOrigin();
  const r = img.getResolution ? img.getResolution() : [360 / w, -360 / h];
  await tif.close();
  return { data, w, h, ox, oy, rx: r[0], ry: r[1] };
}

const readPng16 = (file) => {
  const png = PNG.sync.read(readFileSync(file));
  const at = (x, y) => (png.data[(y * png.width + x) * 4] << 8) | png.data[(y * png.width + x) * 4 + 1];
  return { at, w: png.width, h: png.height };
};
const ELEV = readPng16(join(DATA, "static/elevation_5min.png"));
const PREC = readPng16(join(DATA, "static/precip_5min.png"));

// ---- 采样点阵（tavg 网格每 6 像素）----
const g0 = await loadTavg(1);
const points = [];
for (let py = 0; py < g0.h; py += 6) {
  for (let px = 0; px < g0.w; px += 6) {
    const lon = g0.ox + (px + 0.5) * g0.rx;
    const lat = g0.oy + (py + 0.5) * g0.ry; // ry<0，自北向南
    if (lat <= -90 || lat > 90 || lon < -180 || lon >= 180) continue;
    const ex = Math.min(ELEV.w - 1, Math.max(0, Math.floor(((lon + 180) / 360) * ELEV.w)));
    const ey = Math.min(ELEV.h - 1, Math.max(0, Math.floor(((90 - lat) / 180) * ELEV.h)));
    const pxp = Math.min(PREC.w - 1, Math.max(0, Math.floor(((lon + 180) / 360) * PREC.w)));
    const pyp = Math.min(PREC.h - 1, Math.max(0, Math.floor(((90 - lat) / 180) * PREC.h)));
    // WorldClim 陆地数据：海洋像元为 -3.4e38 哨兵 → 跳过（海洋格留 null 缺测）
    if (g0.data[py * g0.w + px] < -1e30) continue;
    points.push({ lat, lon, py, px, elev: ELEV.at(ex, ey), prec: PREC.at(pxp, pyp),
      cell: Math.min(NLAT - 1, Math.floor((90 - lat) / RES)) * NLON + Math.min(NLON - 1, Math.floor((lon + 180) / RES)) });
  }
}
console.log(`采样点 ${points.length}（tavg 网格 ${g0.w}x${g0.h}）`);

// ---- 累计：tavg 12 个月 + 单次 elev/prec ----
const N = points.length;
const tSum = new Float64Array(NLAT * NLON);
const pSum = new Float64Array(NLAT * NLON);
const eSum = new Float64Array(NLAT * NLON);
const cnt = new Float64Array(NLAT * NLON);
const landCnt = new Float64Array(NLAT * NLON);
for (const p of points) {
  pSum[p.cell] += p.prec; eSum[p.cell] += p.elev;
  if (p.elev > 0) landCnt[p.cell] += 1;
}
for (let m = 1; m <= 12; m++) {
  const g = m === 1 ? g0 : await loadTavg(m);
  for (const p of points) tSum[p.cell] += g.data[p.py * g.w + p.px];
  console.log(`  tavg ${m}/12`);
}

// ---- 聚合 ----
const T0 = new Array(NLAT * NLON).fill(null);
const P0 = new Array(NLAT * NLON).fill(null);
const ELEVG = new Array(NLAT * NLON).fill(null);
const LAND = new Array(NLAT * NLON).fill(null);
for (let i = 0; i < NLAT * NLON; i++) {
  const n = pSum[i] > 0 || cnt[i] > 0 ? undefined : undefined;
  const c = landCnt[i]; // 占位——真实样本数在下方由 points 累计
}
// 用 points 数量正确计数：重跑一遍计数（上面 cnt 未用）
const cellN = new Float64Array(NLAT * NLON);
for (const p of points) cellN[p.cell] += 1;
let valid = 0;
for (let i = 0; i < NLAT * NLON; i++) {
  if (cellN[i] === 0) continue;
  valid++;
  T0[i] = +(tSum[i] / cellN[i] / 12).toFixed(2);
  P0[i] = Math.round(pSum[i] / cellN[i]);
  ELEVG[i] = Math.round(eSum[i] / cellN[i]);
  LAND[i] = landCnt[i] / cellN[i] > 0.5 ? 1 : 0;
}

const ts = `// 自动生成：node packages/data/scripts/gen-grid.mjs —— 请勿手改
// 2.5° 基准气候网格（WorldClim 2.1 tavg/prec + ETOPO 高程聚合）。行 0 = 90N→87.5N；列 0 = 180W→177.5E。null = 缺测。
export const GRID_RES = 2.5;
export const GRID_NLAT = ${NLAT};
export const GRID_NLON = ${NLON};
export const GRID_T0 = ${JSON.stringify(T0)};
export const GRID_P0 = ${JSON.stringify(P0)};
export const GRID_ELEV = ${JSON.stringify(ELEVG)};
export const GRID_LAND = ${JSON.stringify(LAND)};
`;
const out = join(DATA, "../src/generated/grid.gen.ts");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, ts, "utf8");
const manifest = JSON.parse(readFileSync(join(DATA, "manifest.json"), "utf8"));
manifest.entries["generated/grid.gen.ts"] = { sha256: createHash("sha256").update(ts).digest("hex"), bytes: Buffer.byteLength(ts), retrieved: new Date().toISOString().slice(0, 10), source: "gen-grid（WorldClim 10m tavg + elevation/precip_5min 聚合到 2.5°）" };
writeFileSync(join(DATA, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
rmSync(TMP, { recursive: true, force: true });

let wsum = 0, tw = 0, pw = 0, landCells = 0;
for (let r = 0; r < NLAT; r++) {
  const w = Math.cos((90 - (r + 0.5) * RES) * Math.PI / 180);
  for (let c = 0; c < NLON; c++) {
    const i = r * NLON + c;
    if (T0[i] !== null) { wsum += w; tw += w * T0[i]; pw += w * P0[i]; }
    landCells += LAND[i];
  }
}
console.log(`有效格 ${valid}/${NLAT * NLON} 陆地格 ${landCells} | 面积加权基准 T0=${(tw / wsum).toFixed(1)}°C P0=${(pw / wsum).toFixed(0)}mm | grid.gen.ts ${(Buffer.byteLength(ts) / 1024).toFixed(0)}KB`);
