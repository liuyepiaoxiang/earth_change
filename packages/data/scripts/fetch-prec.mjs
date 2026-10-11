// 用法：node packages/data/scripts/fetch-prec.mjs
// 产出: static/precip_5min.png —— 全球年降水格点（WorldClim 2.1 5 角分，12 个月求和），
//       RGB 打包 uint16：R=高字节、G=低字节、单位 mm/yr（0 = 海洋/无数据）；供前端降水图层 shader 采样
// 数据源: https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_5m_prec.zip（CC-BY-SA，~23MB）
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fromFile } from "geotiff";
import { PNG } from "pngjs";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "datasets");
const TMP = join(DATA, "_tmp");
const STATIC = join(DATA, "static");
const TIF = "wc2.1_5m_prec";
const ZIP = join(TMP, `${TIF}.zip`);
const URL = `https://geodata.ucdavis.edu/climate/worldclim/2_1/base/${TIF}.zip`;
mkdirSync(TMP, { recursive: true });
mkdirSync(STATIC, { recursive: true });

// 与 manifest.test.ts 相同的哈希口径（utf8 读取后哈希），保证两端一致
const sha256 = (f) => createHash("sha256").update(readFileSync(f, "utf8")).digest("hex");

if (existsSync(ZIP) && readFileSync(ZIP).length > 22_000_000) {
  console.log("本地已有 zip，跳过下载（重抓请删除 _tmp 下的 zip）");
} else {
  console.log("下载 WorldClim 5' 降水（~23MB，较慢）...");
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`下载失败: HTTP ${res.status}`);
  writeFileSync(ZIP, Buffer.from(await res.arrayBuffer()));
}

console.log("解压（PowerShell Expand-Archive）...");
if (existsSync(join(TMP, TIF))) rmSync(join(TMP, TIF), { recursive: true, force: true });
execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${ZIP}' -DestinationPath '${TMP}' -Force"`);

console.log("读取 12 个月度 GeoTIFF 并求和...");
let w = 0, h = 0, sum = null;
for (let m = 1; m <= 12; m++) {
  const mm = String(m).padStart(2, "0");
  const tif = await fromFile(join(TMP, `${TIF}_${mm}.tif`));
  const img = await tif.getImage();
  if (m === 1) {
    w = img.getWidth();
    h = img.getHeight();
    sum = new Float64Array(w * h);
  }
  const d = (await img.readRasters())[0];
  if (w !== 4320 || h !== 2160) throw new Error(`意外的网格尺寸 ${w}x${h}`);
  for (let i = 0; i < w * h; i++) sum[i] = sum[i] + d[i];
  await tif.close();
}

console.log("编码 RGB 打包 PNG...");
const png = new PNG({ width: w, height: h });
let land = 0;
for (let i = 0; i < w * h; i++) {
  // 海洋/无数据归 0；年降水 mm 以 uint16 打进 R、G 两通道
  const v = sum[i] > 0 ? Math.min(65535, Math.round(sum[i])) : 0;
  if (v > 0) land++;
  png.data[i * 4] = (v >> 8) & 255;
  png.data[i * 4 + 1] = v & 255;
  png.data[i * 4 + 2] = 0;
  png.data[i * 4 + 3] = 255;
}
const OUT = join(STATIC, "precip_5min.png");
writeFileSync(OUT, PNG.sync.write(png));

const manifest = JSON.parse(readFileSync(join(DATA, "manifest.json"), "utf8"));
manifest.entries["static/precip_5min.png"] = {
  sha256: sha256(OUT),
  bytes: readFileSync(OUT).length,
  retrieved: new Date().toISOString().slice(0, 10),
  source: "WorldClim 2.1 precipitation 5 arc-min 年降水（12 月求和；降水图层渲染用）",
};
writeFileSync(join(DATA, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

try {
  rmSync(TMP, { recursive: true, force: true });
} catch {
  // Windows 上偶发句柄延迟；暂存区残留不影响产物
}
console.log(`OK precip_5min.png（${(readFileSync(OUT).length / 1024 / 1024).toFixed(1)} MB，陆地像素 ${((land / (w * h)) * 100).toFixed(0)}%）`);
