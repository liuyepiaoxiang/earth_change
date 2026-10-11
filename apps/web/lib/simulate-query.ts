import { z } from "zod";

const QuerySchema = z.object({
  // 两参数均为必填：公开 API 隐含默认值会让 URL 与缓存键不显式（SPEC §8.4）
  scenario: z.enum(["ssp126", "ssp245", "ssp370", "ssp585"]),
  horizon: z.coerce.number().int().min(2026).max(2500),
  // v1 不确定性量化：uncertainty=mc 追加 p10/p50/p90 区间（种子化确定性蒙特卡洛）
  uncertainty: z.enum(["mc"]).optional(),
});

export type SimulateQuery = z.infer<typeof QuerySchema>;

/** 解析 /api/simulate 查询串；不合法返回 Error（由路由转 400） */
export function parseSimulateQuery(url: string): SimulateQuery | Error {
  const params = Object.fromEntries(new URL(url).searchParams);
  const r = QuerySchema.safeParse(params);
  return r.success ? r.data : new Error(r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
}
