/** V0.3 导出：CSV 年度序列 + PNG 分享卡片（webgl canvas 快照 + 指标文字合成） */
import type { SimResult } from "@future-earth/engine";
/** 兼容 schemaVersion 2/3（含 MC 扩展）的载体类型 */
export type SimResultLike = Omit<SimResult, "schemaVersion"> & { schemaVersion: number };

export function exportCsv(sim: SimResultLike): void {
  const head = "year,tempAnomaly_C,co2_ppm,seaLevel_m,slThermal_m,slGlacier_m,slIceSheet_m,slLandWater_m";
  const rows = sim.years.map((y, i) => [
    y, sim.metrics.tempAnomaly[i], sim.metrics.co2[i], sim.metrics.seaLevel.total[i],
    sim.metrics.seaLevel.thermal[i], sim.metrics.seaLevel.glacier[i],
    sim.metrics.seaLevel.iceSheet[i], sim.metrics.seaLevel.landWater[i],
  ].join(","));
  download(new Blob(["\uFEFF" + [head, ...rows].join("\n")], { type: "text/csv;charset=utf-8" }),
    `future-earth-${sim.scenario}${sim.experiment ? "-exp" : ""}-${sim.years.at(-1)}.csv`);
}

export function exportPngCard(sim: SimResultLike, year: number, slrAt: (y: number) => number, tempAt: (y: number) => number): void {
  const W = 900, H = 560;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#05070f"); g.addColorStop(1, "#0c1a2e");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 地球快照（找页面上的 webgl canvas）
  const gl = Array.from(document.querySelectorAll("canvas")).find((c) => c.width > 200 && c.height > 200);
  if (gl) { try { ctx.drawImage(gl, W / 2 - 220, 60, 440, 440); } catch { /* 跨域污染时跳过快照 */ } }
  ctx.fillStyle = "#e0f2fe"; ctx.font = "bold 30px system-ui";
  ctx.fillText("🌍 未来地球引擎", 30, 50);
  ctx.font = "16px system-ui"; ctx.fillStyle = "#94a3b8";
  const label = sim.experiment ? `${sim.scenario} 教育性实验（排放驱动）` : `${sim.scenario}（IPCC AR6 锚定）`;
  ctx.fillText(`${label} · 模型 ${sim.modelVersion}`, 30, 78);
  ctx.font = "bold 26px system-ui"; ctx.fillStyle = "#fbbf24";
  ctx.fillText(`${year} 年`, 30, 140);
  ctx.font = "22px system-ui";
  ctx.fillStyle = "#f87171"; ctx.fillText(`ΔT +${tempAt(year).toFixed(2)} °C`, 30, 185);
  ctx.fillStyle = "#38bdf8"; ctx.fillText(`海平面 +${slrAt(year).toFixed(2)} m`, 30, 222);
  ctx.fillStyle = "#4ade80"; ctx.fillText(`CO₂ ${sim.metrics.co2[sim.years.indexOf(year)]?.toFixed(0) ?? "—"} ppm`, 30, 259);
  ctx.font = "13px system-ui"; ctx.fillStyle = "#475569";
  ctx.fillText(`数据指纹 ${sim.metadata.dataManifestHash} · 参数 ${sim.paramsFingerprint.slice(7, 23)} · ${sim.warnings.length === 0 ? "稳定性检查通过" : "含告警"}`, 30, H - 24);
  canvas.toBlob((blob) => {
    if (blob) download(blob, `future-earth-${sim.scenario}-${year}.png`);
  }, "image/png");
}

function download(blob: Blob, filename: string): void {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export async function copyShareUrl(url: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(url); return true; } catch { return false; }
}
