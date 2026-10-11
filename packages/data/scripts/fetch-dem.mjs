// 用法：node packages/data/scripts/fetch-dem.mjs [--res 5|10]
// 产出: static/elevation_<res>min.png —— 全球高程图（WorldClim 2.1，源 ETOPO），
//       RGB 打包 uint16：R=高字节、G=低字节、单位米（0 = 海洋/无数据）；供前端淹没 shader 采样
// 数据源: https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_<res>m_elev.zip（CC-BY-SA）
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fromFile } from "geotiff";
import { PNG } from "pngjs";

const argRes = Number(process.argv[process.argv.indexOf("--res") + 1]) || 5;
const RES = argRes === 10 ? 10 : 5;
const DIMS = RES === 10 ? { w: 2160, h: 1080 } : { w: 4320, h: 2160 };

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "datasets");
const TMP = join(DATA, "_tmp");
const STATIC = join(DATA, "static");
const TIF = `wc2.1_${RES}m_elev`;
const ZIP = join(TMP, `${TIF}.zip`);
const URL = `https://geodata.ucdavis.edu/climate/worldclim/2_1/base/${TIF}.zip`;
const OUT = join(STATIC, `elevation_${RES}min.png`);
mkdirSync(TMP, { recursive: true });
mkdirSync(STATIC, { recursive: true });

// 与 manifest.test.ts 相同的哈希口径（utf8 读取后哈希），保证两端一致
const sha256 = (f) => createHash("sha256").update(readFileSync(f, "utf8")).digest("hex");

console.log(`下载 WorldClim ${RES}' 高程...`);
const res = await fetch(URL);
if (!res.ok) throw new Error(`下载失败: HTTP ${res.status}`);
writeFileSync(ZIP, Buffer.from(await res.arrayBuffer()));

console.log("解压（PowerShell Expand-Archive）...");
if (existsSync(join(TMP, TIF))) rmSync(join(TMP, TIF), { recursive: true, force: true });
execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${ZIP}' -DestinationPath '${TMP}' -Force"`);

console.log("读取 GeoTIFF...");
const tif = await fromFile(join(TMP, `${TIF}.tif`));
const img = await tif.getImage();
const w = img.getWidth();
const h = img.getHeight();
const elev = (await img.readRasters())[0];
if (w !== DIMS.w || h !== DIMS.h) throw new Error(`意外的网格尺寸 ${w}x${h}（期望 ${DIMS.w}x${DIMS.h}）`);
// Windows 下文件句柄未释放会挡住 rmSync，读取完立即关闭
await tif.close();

console.log("编码 RGB 打包 PNG...");
const png = new PNG({ width: w, height: h });
let land = 0;
for (let i = 0; i < w * h; i++) {
  // 海洋/无数据（<0）归 0；陆地高程以 uint16 打进 R、G 两通道（B 保留 0）
  const v = elev[i] > 0 ? Math.min(65535, Math.round(elev[i])) : 0;
  if (v > 0) land++;
  png.data[i * 4] = (v >> 8) & 255;
  png.data[i * 4 + 1] = v & 255;
  png.data[i * 4 + 2] = 0;
  png.data[i * 4 + 3] = 255;
}
writeFileSync(OUT, PNG.sync.write(png));

const manifest = JSON.parse(readFileSync(join(DATA, "manifest.json"), "utf8"));
manifest.entries[`static/elevation_${RES}min.png`] = {
  sha256: sha256(OUT),
  bytes: readFileSync(OUT).length,
  retrieved: new Date().toISOString().slice(0, 10),
  source: `WorldClim 2.1 elevation ${RES} arc-min（源 ETOPO；淹没渲染用，非 loaders 数据）`,
};
writeFileSync(join(DATA, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

try {
  rmSync(TMP, { recursive: true, force: true });
} catch {
  // Windows 上偶发句柄延迟；暂存区残留不影响产物，下次运行前会重建
}
console.log(`OK elevation_${RES}min.png（${(readFileSync(OUT).length / 1024 / 1024).toFixed(1)} MB，陆地像素 ${((land / (w * h)) * 100).toFixed(0)}%）`);
