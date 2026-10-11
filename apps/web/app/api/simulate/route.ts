import { NextResponse } from "next/server";
import { runScenario, runScenarioMc } from "@future-earth/engine";
import { parseSimulateQuery } from "../../../lib/simulate-query";

export function GET(request: Request): NextResponse {
  const q = parseSimulateQuery(request.url);
  if (q instanceof Error) {
    return NextResponse.json({ error: q.message }, { status: 400 });
  }
  const sim = runScenario(q.scenario, q.horizon);
  // uncertainty=mc：确定性蒙特卡洛区间（schemaVersion 2，附加字段向后兼容）
  const body =
    q.uncertainty === "mc"
      ? { ...sim, schemaVersion: 2 as const, uncertainty: runScenarioMc(q.scenario, q.horizon) }
      : sim;
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=31536000, immutable" }, // 输出确定性 → CDN 可永久缓存
  });
}
