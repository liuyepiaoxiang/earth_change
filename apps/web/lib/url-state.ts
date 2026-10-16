/** V0.3 URL 可复现状态：/?scenario=ssp245&year=2100&unc=1&exp=<base64 controls> */
import type { ScenarioId, ExperimentControls } from "@future-earth/engine";

export interface UrlState {
  scenario?: ScenarioId;
  year?: number;
  uncertainty?: boolean;
  exp?: ExperimentControls;
}

export function parseUrlState(url: string): UrlState {
  const p = new URL(url).searchParams;
  const out: UrlState = {};
  const sc = p.get("scenario");
  if (sc === "ssp126" || sc === "ssp245" || sc === "ssp370" || sc === "ssp585") out.scenario = sc;
  const y = Number(p.get("year"));
  if (Number.isInteger(y) && y >= 1851 && y <= 2500) out.year = y;
  out.uncertainty = p.get("unc") === "1";
  const exp = p.get("exp");
  if (exp) {
    try {
      const json = JSON.parse(decodeURIComponent(escape(atob(exp))));
      if (typeof json === "object" && json !== null && "emissionScale" in json) out.exp = json as ExperimentControls;
    } catch { /* 无效 exp 静默忽略（可复现性不受破坏，回到基准） */ }
  }
  return out;
}

export function serializeUrlState(s: UrlState, baseUrl = ""): string {
  const q = new URLSearchParams();
  if (s.scenario) q.set("scenario", s.scenario);
  if (s.year !== undefined) q.set("year", String(s.year));
  if (s.uncertainty) q.set("unc", "1");
  if (s.exp) q.set("exp", btoa(unescape(encodeURIComponent(JSON.stringify(s.exp)))));
  const qs = q.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl || "/";
}

export function encodeExp(c: ExperimentControls): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(c))));
}
