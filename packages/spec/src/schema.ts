import { z } from "zod";

export const ImplTier = z.enum(["v0", "v1", "v2", "v3"]);

export const OntologySchema = z.object({
  domains: z.array(z.object({
    id: z.string(),
    name_en: z.string(),
    name_zh: z.string(),
    children: z.array(z.string()).default([]),
  })),
});

export const VariableSchema = z.object({
  id: z.string().regex(/^[a-z_]+\.[a-z_0-9]+$/, "id 必须是 domain.name 形式"),
  name_en: z.string(),
  name_zh: z.string(),
  domain: z.string(),
  unit: z.string(),
  spatial: z.boolean(),
  state_variable: z.boolean(),
  drivers: z.array(z.string()).default([]),
  affects: z.array(z.string()).default([]),
  equations: z.array(z.string()).default([]),
  timescale: z.object({ min: z.number(), typical: z.number(), max: z.number() }),
  data_source: z.string().nullable().default(null),
  impl: ImplTier,
});

export const EquationSchema = z.object({
  id: z.string().regex(/^eq_\d{2}$/),
  name_en: z.string(),
  name_zh: z.string(),
  domain: z.string(),
  formula: z.string(),
  inputs: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([]),
  parameters: z.array(z.string()).default([]),
  notes: z.string().default(""),
  impl: ImplTier,
});

export const ParameterSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name_zh: z.string(),
  unit: z.string(),
  default: z.number(),
  min: z.number(),
  max: z.number(),
  source: z.string(),
  impl: ImplTier,
});

export const CausalEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  mechanism: z.string(),
  sign: z.enum(["positive", "negative"]),
  equation: z.string().nullable().default(null),
  loops: z.array(z.string()).default([]),
});

export const ScenarioSchema = z.object({
  id: z.enum(["ssp126", "ssp245", "ssp370", "ssp585"]),
  name: z.string(),
  name_zh: z.string(),
  target_co2_2100_ppm: z.number(),
  co2_emission_anchors_gtc: z.record(z.string(), z.number()),
  luluc_anchors_gtc: z.record(z.string(), z.number()),
  ch4_anchors_ppb: z.record(z.string(), z.number()),
  n2o_anchors_ppb: z.record(z.string(), z.number()),
  f_other_anchors_wm2: z.record(z.string(), z.number()),
  land_water_rate_m_yr: z.number(),
});

export const DatasetSchema = z.object({
  id: z.string(),
  path: z.string(),
  provider: z.string(),
  url: z.string(),
  license: z.string(),
  stage: z.enum(["a", "b"]),
  variables: z.array(z.string()),
  notes: z.string().default(""),
});

export const SpecBundleSchema = z.object({
  ontology: OntologySchema,
  variables: z.array(VariableSchema),
  equations: z.array(EquationSchema),
  parameters: z.array(ParameterSchema),
  causal_graph: z.array(CausalEdgeSchema),
  scenarios: z.array(ScenarioSchema),
  datasets: z.array(DatasetSchema),
});
