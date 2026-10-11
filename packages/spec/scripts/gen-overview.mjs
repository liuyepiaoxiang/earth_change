// 用法：node packages/spec/scripts/gen-overview.mjs —— 从规格 YAML 生成单页实体总览 docs/实体与公式总览.html（规格变更后重跑）
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
process.chdir(join(dirname(fileURLToPath(import.meta.url)), "../../.."));
const read = (f) => parse(readFileSync(f, "utf8"));
const vars = read("packages/spec/src/spec/variables.yaml");
const eqs = read("packages/spec/src/spec/equations.yaml");
const pars = read("packages/spec/src/spec/parameters.yaml");
const scens = read("packages/spec/src/spec/scenarios.yaml");
const cg = read("packages/spec/src/spec/causal_graph.yaml");
const datasets = read("packages/spec/src/spec/datasets.yaml");
const ontoDoc = read("packages/spec/src/spec/ontology.yaml");
const domains = ontoDoc.domains ?? Object.values(ontoDoc)[0];
const domName = Object.fromEntries(domains.map(d => [d.id, d.name_zh + " " + d.name_en]));

const IMPL_BADGE = {
  v0: '<span class="b b0">已实现</span>',
  v1: '<span class="b b1">诊断式已实现</span>',
  v2: '<span class="b b2">规划</span>',
  v3: '<span class="b b3">规划</span>',
};
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const byDomain = {};
for (const v of vars) (byDomain[v.domain] = byDomain[v.domain] || []).push(v);
const varSections = Object.entries(byDomain).map(([dom, list]) => `
  <h3>${dom} <span class="dim">${domName[dom] ?? ""}</span> <span class="count">${list.length}</span></h3>
  <table><tr><th>id</th><th>名称</th><th>单位</th><th>类型</th><th>批次</th><th>关联方程</th></tr>
  ${list.map(v => `<tr><td class="mono">${esc(v.id)}</td><td>${esc(v.name_zh)}</td><td class="mono">${esc(v.unit ?? "—")}</td><td>${v.state_variable ? '<span class="b bs">状态量</span>' : '<span class="b bd">诊断量</span>'}</td><td>${IMPL_BADGE[v.impl] ?? v.impl}</td><td class="mono dim">${(v.equations ?? []).join(" ")}</td></tr>`).join("")}
  </table>`).join("\n");

const eqRows = eqs.map(e => `<tr><td class="mono">${e.id}</td><td>${esc(e.name_zh)}</td><td class="mono formula">${esc(e.formula)}</td><td>${IMPL_BADGE[e.impl] ?? e.impl}</td></tr>`).join("");
const eqTable = `<table><tr><th>id</th><th>名称</th><th>公式</th><th>批次</th></tr>${eqRows}</table>`;

const parRows = pars.map(p => `<tr><td class="mono">${esc(p.id)}</td><td>${esc(p.name_zh)}</td><td class="mono">${esc(p.default)}</td><td class="mono dim">[${esc(p.min)}, ${esc(p.max)}]</td><td class="mono">${esc(p.unit ?? "—")}</td></tr>`).join("");
const parTable = `<table><tr><th>id</th><th>名称</th><th>默认值</th><th>先验范围</th><th>单位</th></tr>${parRows}</table>`;

const scenCards = scens.map(x => `<div class="card"><b>${esc(x.id)}</b> ${esc(x.name_zh ?? "")}<br/><span class="dim">${Object.keys(x).join(" · ")}</span></div>`).join("");

const edges = Array.isArray(cg) ? cg : (cg.edges ?? cg.causal_graph ?? []);
const loops = {};
for (const e of edges) for (const l of (e.loops ?? [])) loops[l] = (loops[l] || 0) + 1;
const loopHtml = Object.entries(loops).map(([l, n]) => `<span class="b bd">${esc(l)} ×${n}</span>`).join(" ");

const dsList = Array.isArray(datasets) ? datasets : datasets.datasets ?? Object.values(datasets);
const dsRows = dsList.map(d => `<tr><td class="mono">${esc(d.id ?? d.name ?? "")}</td><td>${esc(d.name_zh ?? d.provider ?? "")}</td><td class="mono dim">${esc(d.license ?? d.format ?? "")}</td></tr>`).join("");
const dsTable = `<table><tr><th>id</th><th>名称/提供方</th><th>许可</th></tr>${dsRows}</table>`;

const stateVars = vars.filter(v => v.state_variable).length;
const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"/>
<title>未来地球引擎 — 实体与公式总览</title>
<style>
  body { background: #05070f; color: #e2e8f0; font: 14px/1.6 system-ui, sans-serif; margin: 0; padding: 32px; }
  h1 { color: #e0f2fe; } h2 { color: #7dd3fc; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-top: 40px; }
  h3 { color: #94a3b8; margin-top: 24px; }
  .dim { color: #64748b; font-weight: normal; }
  .count { background: #1e293b; border-radius: 10px; padding: 0 8px; font-size: 12px; color: #7dd3fc; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0 20px; }
  th, td { text-align: left; padding: 4px 10px; border-bottom: 1px solid #1e293b; vertical-align: top; }
  th { color: #64748b; font-weight: 500; }
  tr:hover td { background: rgba(30, 41, 59, 0.4); }
  .mono { font-family: ui-monospace, monospace; font-size: 12.5px; }
  .formula { color: #a5f3fc; }
  .b { border-radius: 4px; padding: 0 6px; font-size: 11px; white-space: nowrap; }
  .b0 { background: #14532d; color: #bbf7d0; } .b1 { background: #1e3a8a; color: #bfdbfe; }
  .b2 { background: #713f12; color: #fde68a; } .b3 { background: #3f3f46; color: #d4d4d8; }
  .bs { background: #4c1d95; color: #ddd6fe; } .bd { background: #334155; color: #cbd5e1; }
  .cards { display: flex; flex-wrap: wrap; gap: 10px; }
  .card { border: 1px solid #1e293b; border-radius: 8px; padding: 8px 12px; background: #0b1220; }
  .stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin: 16px 0; }
  .stat { border: 1px solid #1e293b; border-radius: 8px; padding: 10px 14px; background: #0b1220; }
  .stat b { font-size: 24px; color: #7dd3fc; display: block; }
  .stat span { color: #64748b; font-size: 12px; }
  .note { background: #0b1220; border-left: 3px solid #38bdf8; padding: 8px 14px; border-radius: 4px; color: #94a3b8; font-size: 13px; }
</style></head><body>
<h1>未来地球引擎 — 实体与公式总览</h1>
<p class="dim">由规格 YAML（唯一事实源）机器生成 · 本页为快照，规格变更后运行 node packages/spec/scripts/gen-overview.mjs 重新生成</p>
<div class="stats">
  <div class="stat"><b>10</b><span>本体域</span></div>
  <div class="stat"><b>${vars.length}</b><span>实体（变量）</span></div>
  <div class="stat"><b>${stateVars}</b><span>状态量</span></div>
  <div class="stat"><b>${vars.length - stateVars}</b><span>诊断量</span></div>
  <div class="stat"><b>${eqs.length}</b><span>方程</span></div>
  <div class="stat"><b>${pars.length}</b><span>参数</span></div>
  <div class="stat"><b>${scens.length}</b><span>排放情景</span></div>
  <div class="stat"><b>${edges.length}</b><span>因果边</span></div>
  <div class="stat"><b>${Object.keys(loops).length}</b><span>反馈回路</span></div>
  <div class="stat"><b>${dsList.length}</b><span>数据集</span></div>
</div>
<p class="note">53 条方程已全部实现并注册（批次标记 v0 = 已实现；变量批次 v1/v2/v3 为派生诊断量的演进语义）。依赖方向：web → engine → {spec, data}；solver 积分状态量中的核心子集（CO₂ / 温度两层 / 海平面四项 + v2 四箱 B/W/Mpf/PTh），其余为诊断派生。</p>

<h2>一、本体域（10）</h2>
<table><tr><th>域</th><th>名称</th><th>子域</th></tr>
${domains.map(d => `<tr><td class="mono">${d.id}</td><td>${esc(d.name_zh)} ${esc(d.name_en)}</td><td class="mono dim">${(d.children ?? []).join(", ")}</td></tr>`).join("")}
</table>

<h2>二、实体（变量）${vars.length} —— 按域分组</h2>
${varSections}

<h2>三、方程 ${eqs.length}（全部已实现）</h2>
${eqTable}

<h2>四、参数 ${pars.length}</h2>
${parTable}

<h2>五、排放情景 ${scens.length}</h2>
<div class="cards">${scenCards}</div>

<h2>六、因果图 ${edges.length} 边 · ${Object.keys(loops).length} 反馈回路</h2>
<p>${loopHtml}</p>
<p class="dim">完整边表见 <span class="mono">packages/spec/src/spec/causal_graph.yaml</span></p>

<h2>七、数据集 ${dsList.length}</h2>
${dsTable}

<h2>八、运行时资产（生成物）</h2>
<table><tr><th>资产</th><th>说明</th></tr>
<tr><td class="mono">spec-types.ts</td><td>YAML → TS 字面量联合类型（gen:spec 生成，提交入库）</td></tr>
<tr><td class="mono">datasets.gen.ts</td><td>数据集固化 TS 模块（loaders 读此模块）</td></tr>
<tr><td class="mono">params.gen.ts</td><td>校准参数 + 预计算指纹（pnpm calibrate）</td></tr>
<tr><td class="mono">params.json</td><td>校准产物（参数 + 三阶段日志 + 先验范围）</td></tr>
<tr><td class="mono">elevation_5min.png / precip_5min.png</td><td>淹没/降水 shader 纹理（RGB 打包 uint16）</td></tr>
<tr><td class="mono">earth-blue-marble.jpg</td><td>底图纹理（本地打包，无外链）</td></tr>
</table>
</body></html>`;
writeFileSync("docs/实体与公式总览.html", html);
console.log("generated docs/实体与公式总览.html", (html.length / 1024).toFixed(0) + "KB");
