import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const DS = join(dirname(fileURLToPath(import.meta.url)), "../datasets");

describe("manifest 完整性（fs 级，仅 node 环境）", () => {
  it("磁盘上每个数据文件都有 manifest 条目且校验和一致", () => {
    const m = JSON.parse(readFileSync(join(DS, "manifest.json"), "utf8"));
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = join(dir, e.name);
        return e.isDirectory() ? walk(p) : [relative(DS, p).split("\\").join("/")];
      });
    const files = walk(DS).filter((f) => f !== "manifest.json");
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
