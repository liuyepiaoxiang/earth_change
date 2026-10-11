import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { SpecBundleSchema } from "../src/schema.js";

// 注意：不经 src/index.ts 加载（index 重导出本脚本的产物，会造成模块不存在时的循环依赖）
const SPEC_DIR = join(dirname(fileURLToPath(import.meta.url)), "../src/spec");
const raw = {
  ontology: parse(readFileSync(join(SPEC_DIR, "ontology.yaml"), "utf8")),
  variables: parse(readFileSync(join(SPEC_DIR, "variables.yaml"), "utf8")),
  equations: parse(readFileSync(join(SPEC_DIR, "equations.yaml"), "utf8")),
  parameters: parse(readFileSync(join(SPEC_DIR, "parameters.yaml"), "utf8")),
  causal_graph: parse(readFileSync(join(SPEC_DIR, "causal_graph.yaml"), "utf8")),
  scenarios: parse(readFileSync(join(SPEC_DIR, "scenarios.yaml"), "utf8")),
  datasets: parse(readFileSync(join(SPEC_DIR, "datasets.yaml"), "utf8")),
};
const spec = SpecBundleSchema.parse(raw);

const q = (s: string) => JSON.stringify(s);
const lines: string[] = [
  "// 自动生成：pnpm gen:spec —— 请勿手改",
  `export type VariableId = ${spec.variables.map((v) => q(v.id)).join(" | ")};`,
  `export type EquationId = ${spec.equations.map((e) => q(e.id)).join(" | ")};`,
  `export type ParameterId = ${spec.parameters.map((p) => q(p.id)).join(" | ")};`,
  `export type ScenarioId = ${spec.scenarios.map((s) => q(s.id)).join(" | ")};`,
  `export type ImplTier = "v0" | "v1" | "v2" | "v3";`,
  `export const V0_EQUATIONS: EquationId[] = [${spec.equations.filter((e) => e.impl === "v0").map((e) => q(e.id)).join(", ")}];`,
  `export const V0_EQUATION_COUNT = ${spec.equations.filter((e) => e.impl === "v0").length};`,
];
const out = join(dirname(fileURLToPath(import.meta.url)), "../src/generated/spec-types.ts");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log(`generated: ${out} (v0 equations: ${spec.equations.filter((e) => e.impl === "v0").length})`);
