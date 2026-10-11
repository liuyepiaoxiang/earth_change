// 把 data 包治理的静态渲染资产同步到 Next public/（predev/prebuild 自动执行）
// 单一事实源在 packages/data/datasets/static/（manifest 治理）；public/ 下的是同步产物，勿手改、已 gitignore
import { copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// pnpm workspace：node_modules/@future-earth/data 符号链接到 packages/data
const src = join(root, "node_modules", "@future-earth", "data", "datasets", "static", "elevation_10min.png");
const dest = join(root, "public", "elevation_10min.png");
copyFileSync(src, dest);
console.log("synced elevation_10min.png → public/");
