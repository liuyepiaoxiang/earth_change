// 包根入口保持浏览器安全：只有 zod schema 与生成模块（勿在此引入 node:fs / yaml —— loadSpec 在 ./load-spec.js）
export { SpecBundleSchema } from "./schema.js";
export * from "./generated/spec-types.js";
