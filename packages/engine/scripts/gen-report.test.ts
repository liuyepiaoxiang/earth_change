import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

describe("V02-M03 校准报告", () => {
  it("脚本可执行且报告包含关键节", () => {
    execSync("npx tsx scripts/gen-report.ts", { cwd: fileURLToPath(new URL("../", import.meta.url)), stdio: "ignore" });
    const p = new URL("../../../docs/superpowers/reports/calibration-report.md", import.meta.url);
    expect(existsSync(p)).toBe(true);
    const md = readFileSync(p, "utf8");
    for (const sec of ["指纹", "历史复现", "未来情景", "碳闭合", "ssp585"]) expect(md).toContain(sec);
  });
});
