import { NextResponse } from "next/server";

export const revalidate = 3600; // 每小时重新验证

interface LiveData {
  co2: { value: number; date: string; trend: string } | null;
  temperature: { anomaly: number; month: string } | null;
  seaLevel: { trend: number; note: string } | null;
  fetchedAt: string;
}

export async function GET(): Promise<NextResponse> {
  const result: LiveData = {
    co2: null,
    temperature: null,
    seaLevel: null,
    fetchedAt: new Date().toISOString(),
  };

  // NOAA Global CO₂ — 公开 API 无需密钥
  try {
    const resp = await fetch("https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_gl.txt", {
      next: { revalidate: 3600 },
    });
    if (resp.ok) {
      const text = await resp.text();
      const lines = text.split("\n").filter((l) => !l.startsWith("#") && l.trim());
      const last = lines[lines.length - 1]!.split(/\s+/);
      const value = parseFloat(last[3]!);
      const prevLines = lines[lines.length - 13]?.split(/\s+/);
      const prevValue = prevLines ? parseFloat(prevLines[3]!) : value;
      if (Number.isFinite(value)) {
        result.co2 = {
          value: value,
          date: `${last[0]!}-${String(last[1]!).padStart(2, "0")}`,
          trend: value > prevValue ? "↑" : value < prevValue ? "↓" : "→",
        };
      }
    }
  } catch { /* 静默降级 */ }

  // NASA GISTEMP — 使用我们已打包的观测数据（最新月度值）
  try {
    const { loadTemperature } = await import("@future-earth/data");
    const temp = loadTemperature();
    const last = temp[temp.length - 1]!;
    const yearAgo = temp[temp.length - 13] ?? last;
    result.temperature = {
      anomaly: last.anomaly,
      month: `${last.year}`,
    };
    // 计算趋势
    const trend = last.anomaly > yearAgo.anomaly ? "↑" : "↓";
    result.temperature.anomaly = last.anomaly;
    (result.temperature as { trend?: string }).trend = trend;
  } catch { /* 静默降级 */ }

  // 海平面 — 使用卫星高度计长期趋势（NASA 公开数据约 3.5mm/yr）
  result.seaLevel = {
    trend: 3.5,
    note: "Satellite altimetry average 1993-2024 (NASA)",
  };

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
