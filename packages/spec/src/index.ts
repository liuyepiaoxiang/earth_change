import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { SpecBundleSchema } from "./schema.js";

const SPEC_DIR = join(dirname(fileURLToPath(import.meta.url)), "spec");

function loadYaml<T>(name: string): T {
  return parse(readFileSync(join(SPEC_DIR, name), "utf8")) as T;
}

export function loadSpec() {
  const raw = {
    ontology: loadYaml("ontology.yaml"),
    variables: loadYaml("variables.yaml"),
    equations: loadYaml("equations.yaml"),
    parameters: loadYaml("parameters.yaml"),
    causal_graph: loadYaml("causal_graph.yaml"),
    scenarios: loadYaml("scenarios.yaml"),
    datasets: loadYaml("datasets.yaml"),
  };
  return SpecBundleSchema.parse(raw); // 不合法立即抛错
}
export { SpecBundleSchema } from "./schema.js";
