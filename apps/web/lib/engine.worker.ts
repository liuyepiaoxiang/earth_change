/// <reference lib="webworker" />
// 引擎计算专用 Worker（V1-03）：MC 等重计算移出主线程，UI 保持 60fps。
// 消息协议：{ id, scenario, horizon, uncertainty } → { id, ok, sim? / error? }
import { runScenario, runScenarioMc } from "@future-earth/engine";
import type { ScenarioId } from "@future-earth/engine";

export interface WorkerRequest {
  id: number;
  scenario: ScenarioId;
  horizon: number;
  uncertainty: boolean;
}
export interface WorkerOk {
  id: number;
  ok: true;
  sim: unknown; // SimResultWithUnc（避免与 lib/sim 循环依赖，结构由调用方断言）
}
export interface WorkerErr {
  id: number;
  ok: false;
  error: string;
}
export type WorkerResponse = WorkerOk | WorkerErr;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, scenario, horizon, uncertainty } = e.data;
  try {
    const sim = runScenario(scenario, horizon);
    const out =
      uncertainty
        ? { ...sim, schemaVersion: 3 as const, uncertainty: runScenarioMc(scenario, horizon) }
        : sim;
    ctx.postMessage({ id, ok: true, sim: out } satisfies WorkerResponse);
  } catch (err) {
    ctx.postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err) } satisfies WorkerResponse);
  }
};
