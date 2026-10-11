// 把 data 包治理的静态渲染资产同步到 Next public/（predev/prebuild 自动执行）
// 单一事实源在 packages/data/datasets/static/（manifest 治理）；public/ 下的是同步产物，勿手改、已 gitignore
import { copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// pnpm workspace：node_modules/@future-earth/data 符号链接到 packages/data
for (const f of ["elevation_5min.png", "precip_5min.png"]) {
  copyFileSync(join(root, "node_modules", "@future-earth", "data", "datasets", "static", f), join(root, "public", f));
}
const src = join(root, "node_modules", "@future-earth", "data", "datasets", "static", "elevation_5min.png");
const dest = join(root, "public", "elevation_5min.png");
console.log("synced: elevation_5min.png, precip_5min.png → public/");
