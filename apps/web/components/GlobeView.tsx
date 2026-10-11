"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { isCityFlooded, localDTs } from "@future-earth/engine";
import type { WarmingPatternBand } from "@future-earth/engine";
import type { CityRow, PatternBand } from "@future-earth/data";
import type { MetricsSnapshot } from "../lib/sim";
import LayerControl from "./LayerControl";
import { DEFAULT_LAYERS, type LayerState } from "./LayerControl";

// react-globe.gl 依赖 WebGL/浏览器 API，仅客户端装载
const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => <div style={centerStyle}>地球渲染器装载中…</div>,
});

const centerStyle = { height: "100%", display: "grid", placeItems: "center", color: "#475569" } as const;

type GridPoint = { kind: "grid"; lat: number; lng: number; dt: number };
type CityPoint = {
  kind: "city";
  lat: number;
  lng: number;
  city: CityRow;
  dtLocal: number;
  flooded: boolean;
  alt: number;
  radius: number;
};
type GlobePoint = GridPoint | CityPoint;

/** 城市点半径按 √人口 归一化时的分母 */
const maxPop = (cities: CityRow[]) => Math.max(...cities.map((c) => c.population), 1);

/** ΔT(°C) → 蓝→红 色阶（0–6°C 线性映射色相 220→0）。直接算 RGB hex，绕开 three.js 的 CSS hsl 解析 */
function tempColor(dt: number): string {
  const t = Math.min(1, Math.max(0, dt / 6));
  const h = (220 * (1 - t)) / 360;
  const s = 0.8;
  const l = 0.6 - 0.18 * t;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const chan = (t6: number) => {
    const v = t6 < 1 / 6 ? p + (q - p) * 6 * t6 : t6 < 1 / 2 ? q : t6 < 2 / 3 ? p + (q - p) * (2 / 3 - t6) * 6 : p;
    return Math.min(1, Math.max(0, v));
  };
  const r = Math.round(chan(h + 1 / 3) * 255);
  const g = Math.round(chan(h) * 255);
  const b = Math.round(chan(h - 1 / 3) * 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// react-globe.gl 的 ObjAccessor 参数是 object，收窄在内部完成
const getLat = (d: object) => (d as GlobePoint).lat;
const getLng = (d: object) => (d as GlobePoint).lng;
const getColor = (d: object) => {
  const p = d as GlobePoint;
  return p.kind === "grid" ? tempColor(p.dt) : p.flooded ? "#38bdf8" : "#eab308";
};
const getAltitude = (d: object) => {
  const p = d as GlobePoint;
  return p.kind === "grid" ? 0.008 : p.alt;
};
const getRadius = (d: object) => {
  const p = d as GlobePoint;
  return p.kind === "grid" ? 1.9 : p.radius;
};
const getLabel = (d: object) => {
  const p = d as GlobePoint;
  if (p.kind === "grid") {
    return `<div style="font:12px system-ui;color:#e2e8f0">ΔT +${p.dt.toFixed(2)}°C（${p.lat}°, ${p.lng}°）</div>`;
  }
  const c = p.city;
  return (
    `<div style="font:12px system-ui;color:#e2e8f0"><b>${c.name}</b>（${c.country}，人口 ${(c.population / 10000).toFixed(0)} 万）` +
    `<br/>高程 ${c.elevation} m · 本地 ΔT +${p.dtLocal.toFixed(2)}°C${p.flooded ? " · 已淹没" : ""}</div>`
  );
};
const onPointClick = (point: object, onSelectCity: (c: CityRow) => void) => {
  const p = point as GlobePoint;
  if (p.kind === "city") onSelectCity(p.city);
};

export default function GlobeView({
  snap,
  cities,
  pattern,
  onSelectCity,
}: {
  snap: MetricsSnapshot;
  cities: CityRow[];
  pattern: PatternBand[];
  onSelectCity: (c: CityRow) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS);
  const toggleLayer = (key: keyof LayerState) => setLayers((s) => ({ ...s, [key]: !s[key] }));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]!.contentRect;
      setSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points = useMemo<GlobePoint[]>(() => {
    const dtGlobal = snap.tempAnomaly;
    const slr = snap.seaLevel.total;
    const bands = pattern.length ? pattern : undefined;
    const grid: GridPoint[] = [];
    if (layers.temperature) {
      for (let i = 0; i < 36; i++) {
        const lat = -87.5 + i * 5;
        for (let j = 0; j < 72; j++) {
          const lng = -177.5 + j * 5;
          grid.push({ kind: "grid", lat, lng, dt: localDTs(dtGlobal, lat, bands) });
        }
      }
    }
    const cityPts: CityPoint[] = layers.cities
      ? cities.map((c) => {
          const flooded = isCityFlooded(c.elevation, slr);
          const aboveM = Math.max(0, c.elevation - slr);
          return {
            kind: "city",
            lat: c.lat,
            lng: c.lon,
            city: c,
            dtLocal: localDTs(dtGlobal, c.lat, bands),
            flooded,
            alt: flooded ? 0.016 : Math.min(0.14, 0.012 + (aboveM / 8848) * 0.12),
            radius: 0.22 + 0.5 * Math.sqrt(c.population / maxPop(cities)),
          };
        })
      : [];
    return [...grid, ...cityPts];
  }, [snap, cities, pattern, layers]);

  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      {size.w > 0 && (
        <Globe
          width={size.w}
          height={size.h}
          globeImageUrl={layers.basemap ? "/earth-blue-marble.jpg" : null}
          backgroundColor="rgba(0,0,0,0)"
          atmosphereColor="#5b7fa6"
          atmosphereAltitude={layers.atmosphere ? 0.12 : 0}
          pointsData={points}
          pointLat={getLat}
          pointLng={getLng}
          pointColor={getColor}
          pointAltitude={getAltitude}
          pointRadius={getRadius}
          pointLabel={getLabel}
          onPointClick={(point: object) => onPointClick(point, onSelectCity)}
        />
      )}
      <LayerControl layers={layers} onToggle={toggleLayer} />
      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          fontSize: 11,
          color: "#64748b",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ΔT 0
        <span
          style={{
            width: 90,
            height: 8,
            borderRadius: 4,
            background: "linear-gradient(90deg, hsl(220,85%,58%), hsl(110,85%,50%), hsl(0,85%,42%))",
          }}
        />
        +5°C · <span style={{ color: "#eab308" }}>●</span> 城市（蓝 = 已淹没）
      </div>
    </div>
  );
}
