// 要素总览数据（F17）：从规格 YAML 构建时导出，供 web 总览页消费。
// Node 专用入口（读 YAML），页面数据经 server 组件/构建期生成，浏览器不加载 yaml。
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { SpecBundleSchema } from "./schema.js";

const SPEC_DIR = join(dirname(fileURLToPath(import.meta.url)), "spec");

function loadYaml(name: string): unknown {
  return parse(readFileSync(join(SPEC_DIR, name), "utf8"));
}

export interface OverviewData {
  domains: Array<{ id: string; name_zh: string; name_en: string; children: string[] }>;
  variables: Array<{ id: string; name_zh: string; unit: string; domain: string; impl: string; state: boolean; equations: string[] }>;
  equations: Array<{ id: string; name_zh: string; formula: string; domain: string; impl: string }>;
  parameters: Array<{ id: string; name_zh: string; default: number; min: number; max: number; unit: string }>;
  scenarios: Array<{ id: string; name_zh?: string }>;
  causalEdges: number;
  loops: Array<{ id: string; count: number }>;
  datasets: Array<{ id: string; name: string }>;
}

/** 构建期/SSR 调用：解析全部规格 YAML 并做 zod 校验，输出总览页所需的轻量数据 */
export function loadOverviewData(): OverviewData {
  const raw = {
    ontology: loadYaml("ontology.yaml"),
    variables: loadYaml("variables.yaml"),
    equations: loadYaml("equations.yaml"),
    parameters: loadYaml("parameters.yaml"),
    causal_graph: loadYaml("causal_graph.yaml"),
    scenarios: loadYaml("scenarios.yaml"),
    datasets: loadYaml("datasets.yaml"),
  };
  const bundle = SpecBundleSchema.parse(raw); // 与 load-spec 同一校验门

  const edges = Array.isArray(bundle.causal_graph)
    ? bundle.causal_graph
    : ((bundle.causal_graph as { edges?: Array<{ loops?: string[] }> }).edges ?? []);
  const loops: Record<string, number> = {};
  for (const e of edges as Array<{ loops?: string[] }>) for (const l of e.loops ?? []) loops[l] = (loops[l] || 0) + 1;

  // zod bundle 的 ontology 是包装对象 { domains: [...] }（与 YAML 顶层一致）
  const ontoWrapped = bundle.ontology as unknown as { domains: OverviewData["domains"] };
  const ontoDomains = (ontoWrapped.domains ?? []) as OverviewData["domains"];

  // 变量：zod 字段 state_variable → 页面字段 state（映射，保证 UI 契约稳定）
  const rawVars = bundle.variables as unknown as Array<{
    id: string; name_zh: string; unit?: string; domain: string; impl: string;
    state_variable: boolean; equations?: string[];
  }>;
  const variables = rawVars.map((v) => ({
    id: v.id, name_zh: v.name_zh, unit: v.unit ?? "", domain: v.domain,
    impl: v.impl, state: v.state_variable, equations: v.equations ?? [],
  }));
  const rawScen = (bundle.scenarios ?? []) as unknown as Array<{ id: string; name_zh?: string }>;

  return {
    domains: ontoDomains,
    variables,
    equations: bundle.equations as unknown as OverviewData["equations"],
    parameters: bundle.parameters as unknown as OverviewData["parameters"],
    scenarios: rawScen as unknown as OverviewData["scenarios"],
    causalEdges: edges.length,
    loops: Object.entries(loops).map(([id, count]) => ({ id, count })),
    datasets: (bundle.datasets ?? []) as unknown as OverviewData["datasets"],
  };
}
