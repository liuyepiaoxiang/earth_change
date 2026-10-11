import { NextResponse } from "next/server";
import { runScenario } from "@future-earth/engine";
import { parseSimulateQuery } from "../../../lib/simulate-query";

export function GET(request: Request): NextResponse {
  const q = parseSimulateQuery(request.url);
  if (q instanceof Error) {
    return NextResponse.json({ error: q.message }, { status: 400 });
  }
  const result = runScenario(q.scenario, q.horizon);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=31536000, immutable" }, // 输出确定性 → CDN 可永久缓存
  });
}
