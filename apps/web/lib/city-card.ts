/** C1 城市命运分享卡：canvas 绘制 900×1200 竖版 PNG（城市名/风险色/首淹年份大字/双曲线/品牌尾注）。
 *  复用 export.ts 的 download 流水线（本文件自带以避免循环依赖）；曲线走 lib/spark-path.ts。 */
import type { CityRow } from "@future-earth/data";
import type { SimResultWithUnc } from "./sim";
import { localDTs, urbanHeatIsland } from "@future-earth/engine";
import { sparkPoints } from "./spark-path";

export interface CityCardData {
  city: CityRow;
  sim: SimResultWithUnc;
  pattern: Array<{ latMin: number; latMax: number; amp: number }>;
  /** 首淹年份（null = 2500 年内不淹没） */
  firstFlood: number | null;
  /** 当前年（曲线 marker） */
  year: number;
}

/** 高程风险分档（与 CityPanel / /city SEO 页同口径） */
function riskColor(elevation: number): string {
  if (elevation < 2) return "#f87171";
  if (elevation < 5) return "#fbbf24";
  if (elevation < 20) return "#94a3b8";
  return "#4ade80";
}

function download(blob: Blob, filename: string): void {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function generateCityCard(d: CityCardData, locale: "zh" | "en"): void {
  const W = 900, H = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  const zh = locale === "zh";
  const rc = riskColor(d.city.elevation);

  // 渐变底 + 风险色顶条
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#05070f"); g.addColorStop(1, "#0c1a2e");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = rc; ctx.fillRect(0, 0, W, 10);

  // 头部：品牌 + 城市
  ctx.fillStyle = "#7dd3fc"; ctx.font = "bold 26px system-ui";
  ctx.fillText(zh ? "🌍 未来地球引擎 · 城市命运卡" : "🌍 Future Earth Engine · City Destiny", 40, 72);
  ctx.fillStyle = "#f1f5f9"; ctx.font = "bold 64px system-ui";
  ctx.fillText(d.city.name, 40, 170);
  ctx.fillStyle = "#94a3b8"; ctx.font = "26px system-ui";
  ctx.fillText(zh ? `${d.city.country} · 高程 ${d.city.elevation} m · 人口 ${(d.city.population / 1e4).toFixed(0)} 万` : `${d.city.country} · ${d.city.elevation} m · pop ${(d.city.population / 1e6).toFixed(1)}M`, 40, 215);

  // 首淹年份大字
  ctx.font = "28px system-ui"; ctx.fillStyle = "#94a3b8";
  ctx.fillText(zh ? "首淹年份（SSP5-8.5，相对 1850 基线）" : "First flood year (SSP5-8.5, vs 1850)", 40, 290);
  ctx.font = "bold 96px system-ui";
  ctx.fillStyle = d.firstFlood === null ? "#4ade80" : rc;
  ctx.fillText(d.firstFlood === null ? (zh ? "2500 年内不淹没" : "Never by 2500") : String(d.firstFlood), 40, 400);

  // 曲线一：年均温（城市级）；pattern 空数组传 undefined 走引擎默认带（patternAmp 不接受空表）
  const years = d.sim.years;
  const pat = d.pattern.length ? d.pattern : undefined;
  const temps: Array<number | null> = years.map((y, i) => {
    const dT = d.sim.metrics.tempAnomaly[i];
    return dT === undefined ? null : d.city.tbase + localDTs(dT, d.city.lat, pat) + urbanHeatIsland(d.city.population);
  });
  const margins: Array<number | null> = years.map((_, i) => {
    const slr = d.sim.metrics.seaLevel.total[i];
    return slr === undefined ? null : d.city.elevation - slr;
  });

  const chart = (vals: Array<number | null>, y0: number, color: string, label: string, zeroLine?: boolean) => {
    ctx.fillStyle = "#94a3b8"; ctx.font = "22px system-ui";
    ctx.fillText(label, 40, y0 - 14);
    const w = W - 80, h = 180, x0 = 40;
    // 零线
    const pts = sparkPoints(vals, w, h, { pad: 6, bottom: 10 });
    if (zeroLine) {
      const all = vals.filter((v): v is number => v !== null);
      if (all.length > 0 && Math.min(...all) < 0) {
        // 粗略零位：用与 sparkPoints 相同的缩放求 y —— 近似即可（卡片视觉用）
        const lo0 = Math.min(...all), hi0 = Math.max(...all), span = hi0 - lo0 || 1;
        const l = lo0 - span * 0.1, hh = hi0 + span * 0.1;
        const yZero = y0 + 6 + (1 - (0 - l) / (hh - l)) * (h - 16);
        if (yZero > y0 && yZero < y0 + h) {
          ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x0, yZero); ctx.lineTo(x0 + w, yZero); ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineJoin = "round";
    for (const seg of pts) {
      ctx.beginPath();
      seg.forEach((p, i) => (i === 0 ? ctx.moveTo(x0 + p.x, y0 + 6 + p.y) : ctx.lineTo(x0 + p.x, y0 + 6 + p.y)));
      ctx.stroke();
    }
    // 年份标注
    ctx.fillStyle = "#64748b"; ctx.font = "18px system-ui";
    ctx.fillText(String(years[0]!), x0, y0 + h + 22);
    const last = String(years[years.length - 1]!);
    ctx.fillText(last, x0 + w - ctx.measureText(last).width, y0 + h + 22);
  };

  chart(temps, 480, "#f87171", zh ? `年均温演化（当前 ${d.city.tbase.toFixed(1)}°C）` : `Annual temp (now ${d.city.tbase.toFixed(1)}°C)`);
  chart(margins, 760, "#38bdf8", zh ? "淹没余量（高程 − 海平面，低于零线 = 淹没）" : "Flood margin (elev − SLR, below zero = flooded)", true);

  // 当前年 marker（温度图）
  const yi = years.indexOf(d.year);
  if (yi > 0) {
    const w = W - 80;
    const x = 40 + 6 + (yi / (years.length - 1)) * (w - 12);
    ctx.strokeStyle = "#f59e0b"; ctx.setLineDash([5, 4]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, 480); ctx.lineTo(x, 660); ctx.stroke();
    ctx.setLineDash([]);
  }

  // 尾注
  ctx.fillStyle = "#475569"; ctx.font = "18px system-ui";
  ctx.fillText(zh ? `情景 ${d.sim.scenario.toUpperCase()} · 模型 ${d.sim.modelVersion} · earth-change.vercel.app` : `${d.sim.scenario.toUpperCase()} · model ${d.sim.modelVersion} · earth-change.vercel.app`, 40, H - 40);

  canvas.toBlob((blob) => {
    if (blob) download(blob, `city-destiny-${d.city.name.toLowerCase().replace(/\s+/g, "-")}.png`);
  }, "image/png");
}
