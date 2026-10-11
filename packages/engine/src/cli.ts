/** 用法：npx tsx packages/engine/src/cli.ts --scenario ssp245 --horizon 2500 */
import { runScenario } from "./index.js";
import type { ScenarioId } from "@future-earth/spec";

const args = process.argv.slice(2);
const get = (k: string, d: string) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1]! : d; };
const id = get("scenario", "ssp245") as ScenarioId;
const horizon = Math.min(Number(get("horizon", "2500")), 2500);
const allowed: ScenarioId[] = ["ssp126", "ssp245", "ssp370", "ssp585"];
if (!allowed.includes(id)) { console.error(`未知情景 ${id}；可选: ${allowed.join(", ")}`); process.exit(1); }

const r = runScenario(id, horizon);
console.log(`\n未来地球引擎 v0 — ${id} (至 ${horizon})\n`);
console.log("年份    ΔT(°C)   CO₂(ppm)   海平面(m)   [热膨/冰川/冰盖/陆水]");
for (const y of [2030, 2050, 2100, 2200, 2500].filter((y) => y <= horizon)) {
  const i = r.years.indexOf(y);
  if (i < 0) continue;
  const m = r.metrics;
  console.log(
    `${y}   ${m.tempAnomaly[i]!.toFixed(2).padStart(6)}   ${m.co2[i]!.toFixed(0).padStart(8)}   ${m.seaLevel.total[i]!.toFixed(2).padStart(8)}   [${m.seaLevel.thermal[i]!.toFixed(2)}/${m.seaLevel.glacier[i]!.toFixed(2)}/${m.seaLevel.iceSheet[i]!.toFixed(2)}/${m.seaLevel.landWater[i]!.toFixed(2)}]`,
  );
}
