import { NextResponse } from "next/server";
import { runScenario, runScenarioMc, runExperiment, crossingYears } from "@future-earth/engine";
import { parseSimulateQuery } from "../../../lib/simulate-query";
import { parseUrlState, serializeUrlState } from "../../../lib/url-state";
import type { ExperimentControls } from "@future-earth/engine";

export function GET(request: Request): NextResponse {
  const q = parseSimulateQuery(request.url);
  if (q instanceof Error) {
    return NextResponse.json({ error: q.message }, { status: 400 });
  }
  // exp=<base64 controls>：情景实验室实验（排放驱动；zod 越界 → 400）
  const expRaw = parseUrlState(request.url).exp;
  let exp: ExperimentControls | undefined;
  if (new URL(request.url).searchParams.has("exp")) {
    if (!expRaw) return NextResponse.json({ error: "exp 参数无效（base64 解码或 schema 校验失败）" }, { status: 400 });
    exp = expRaw;
  }
  const sim = exp ? runExperiment(q.scenario, exp, q.horizon) : runScenario(q.scenario, q.horizon);
  // uncertainty=mc：确定性蒙特卡洛区间（实验模式暂不提供）
  const body =
    q.uncertainty === "mc" && !exp
      ? { ...sim, schemaVersion: 3 as const, uncertainty: runScenarioMc(q.scenario, q.horizon) }
      : sim;
  // V0.3：canonicalUrl + 实验摘要（与页面共享同一 URL 规范化）
  const u = new URL(request.url);
  const canonicalUrl = serializeUrlState(
    { scenario: q.scenario, year: 2100, uncertainty: q.uncertainty === "mc", exp },
    u.origin + u.pathname.replace("/api/simulate", "/"),
  ).replace("&year=2100", ""); // API 不锁年份——canonical 指向页面默认态
  const i2100 = sim.years.indexOf(2100);
  const summary = {
    scenario: sim.scenario,
    experiment: sim.experiment ?? null,
    dT2100: i2100 >= 0 ? sim.metrics.tempAnomaly[i2100] : null,
    dTend: sim.metrics.tempAnomaly.at(-1)!,
    slr2100: i2100 >= 0 ? sim.metrics.seaLevel.total[i2100] : null,
    slrEnd: sim.metrics.seaLevel.total.at(-1)!,
    crossings: crossingYears(sim.years, sim.metrics.tempAnomaly),
  };
  return NextResponse.json({ ...body, canonicalUrl, summary }, {
    headers: { "Cache-Control": "public, max-age=31536000, immutable" }, // 同参数输出确定性 → CDN 可永久缓存
  });
}
