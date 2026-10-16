import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { loadSpec } from "@future-earth/spec/node";

const DS = join(dirname(fileURLToPath(import.meta.url)), "../datasets");

describe("manifest 完整性（fs 级，仅 node 环境）", () => {
  it("磁盘上每个数据文件都有 manifest 条目且校验和一致", () => {
    const m = JSON.parse(readFileSync(join(DS, "manifest.json"), "utf8"));
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = join(dir, e.name);
        return e.isDirectory() ? walk(p) : [relative(DS, p).split("\\").join("/")];
      });
    // _tmp/ 是抓取脚本的下载暂存区（正常结束会自删），不属于数据集，不做 manifest 校验
    const files = walk(DS).filter((f) => f !== "manifest.json" && !f.startsWith("_tmp/"));
    for (const f of files) {
      expect(m.entries[f], f).toBeDefined();
      const h = createHash("sha256").update(readFileSync(join(DS, f), "utf8")).digest("hex");
      expect(h, f).toBe(m.entries[f].sha256);
    }
    expect(files.length).toBeGreaterThanOrEqual(8);
  });
  it("生成模块存在", () => {
    expect(existsSync(join(DS, "../src/generated/datasets.gen.ts"))).toBe(true);
  });
});

describe("规格数据源 ↔ manifest 交叉校验（V02-M04）", () => {
  it("datasets.yaml 中 stage=a 的路径（去 datasets/ 前缀、glob 展开）都必须在 manifest 中", () => {
    const m = JSON.parse(readFileSync(join(DS, "manifest.json"), "utf8"));
    const spec = loadSpec();
    for (const d of spec.datasets) {
      if (d.stage !== "a") continue;
      if (d.path.includes("*")) {
        // glob：取目录前缀，要求至少一个匹配条目
        const dir = d.path.replace("datasets/", "").split("*")[0]!;
        const hits = Object.keys(m.entries).filter((k) => k.startsWith(dir));
        expect(hits.length, d.id).toBeGreaterThan(0);
      } else {
        const rel = d.path.replace("datasets/", "");
        expect(m.entries[rel], `${d.id} → ${rel}`).toBeDefined();
      }
    }
  });
});
