"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MeshPhongMaterial, NearestFilter, SRGBColorSpace, Texture, TextureLoader } from "three";
import { isCityFlooded, localDTs } from "@future-earth/engine";
import { tempColorHex } from "../lib/colormap";
import type { WarmingPatternBand } from "@future-earth/engine";
import type { CityRow, PatternBand } from "@future-earth/data";
import type { MetricsSnapshot } from "../lib/sim";
import LayerControl from "./LayerControl";
import Colorbar from "./Colorbar";
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


// react-globe.gl 的 ObjAccessor 参数是 object，收窄在内部完成
const getLat = (d: object) => (d as GlobePoint).lat;
const getLng = (d: object) => (d as GlobePoint).lng;
const getColor = (d: object) => {
  const p = d as GlobePoint;
  return p.kind === "grid" ? tempColorHex(p.dt) : p.flooded ? "#38bdf8" : "#eab308";
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

  // 淹没 shader 的共享 uniform（对象引用跨渲染稳定，直接改 .value 即可驱动 GPU）
  const uSlr = useRef({ value: 0 });
  const uFlood = useRef({ value: 1 });
  const uDem = useRef<{ value: Texture | null }>({ value: null });
  const uPrec = useRef<{ value: Texture | null }>({ value: null });
  const uPrecOn = useRef({ value: 0 });

  // 自定义地球材质：注入 DEM 高程采样，elev ∈ (0, SLR] 的陆地渲染为水色（SPEC §8.2 淹没层）
  const globeMaterial = useMemo(() => {
    const mat = new MeshPhongMaterial({ color: 0x0b1e33 });
    // 无论有无底图纹理都保证 vUv 可用（淹没采样依赖球面 UV）
    mat.defines = { USE_UV: "" };
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSlr = uSlr.current;
      shader.uniforms.uFlood = uFlood.current;
      shader.uniforms.uDem = uDem.current;
      shader.uniforms.uPrec = uPrec.current;
      shader.uniforms.uPrecOn = uPrecOn.current;
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
           uniform sampler2D uDem;
           uniform sampler2D uPrec;
           uniform float uSlr;
           uniform float uFlood;
           uniform float uPrecOn;`,
        )
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>
           if (uPrecOn > 0.5) {
             // 降水图层（F12）：年降水 0–2500mm → 干旱棕/半湿黄绿/湿润深绿，只着色陆地
             vec2 pr = texture2D(uPrec, vUv).rg;
             float pmm = floor(pr.r * 255.0 + 0.5) * 256.0 + floor(pr.g * 255.0 + 0.5);
             if (pmm > 0.5) {
               float pt = clamp(pmm / 2500.0, 0.0, 1.0);
               vec3 dry = vec3(0.71, 0.45, 0.20);
               vec3 semi = vec3(0.78, 0.75, 0.35);
               vec3 wet = vec3(0.12, 0.45, 0.20);
               vec3 pc = pt < 0.5 ? mix(dry, semi, pt * 2.0) : mix(semi, wet, (pt - 0.5) * 2.0);
               diffuseColor.rgb = mix(diffuseColor.rgb, pc, 0.8);
             }
           }
           if (uFlood > 0.5) {
             vec2 d = texture2D(uDem, vUv).rg;
             float elevM = floor(d.r * 255.0 + 0.5) * 256.0 + floor(d.g * 255.0 + 0.5);
             float flood = (1.0 - smoothstep(uSlr - 30.0, uSlr + 30.0, elevM)) * step(0.5, elevM);
             diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.219, 0.741, 0.973), flood * 0.9);
           }`,
        );
    };
    return mat;
  }, []);

  useEffect(() => {
    const loader = new TextureLoader();
    loader.load("/precip_5min.png", (tex) => {
      tex.magFilter = NearestFilter;
      tex.minFilter = NearestFilter;
      tex.generateMipmaps = false;
      uPrec.current.value = tex;
    });
    loader.load("/elevation_5min.png", (tex) => {
      // 打包数据纹理必须最近邻采样：线性插值会让 R/G 通道独立混合、破坏 uint16 解码
      tex.magFilter = NearestFilter;
      tex.minFilter = NearestFilter;
      tex.generateMipmaps = false;
      uDem.current.value = tex;
    });
  }, []);

  useEffect(() => {
    uSlr.current.value = snap.seaLevel.total;
  }, [snap]);

  useEffect(() => {
    uFlood.current.value = layers.flood ? 1 : 0;
  }, [layers.flood]);
  useEffect(() => {
    uPrecOn.current.value = layers.prec ? 1 : 0;
  }, [layers.prec]);

  // 底图显隐由本材质自管，不走 globeImageUrl prop：three-globe 该 setter 的 OFF 分支不清 map
  // 也不置 needsUpdate，ON 分支设 color=null 会被 uniform 刷新跳过——关→开后 diffuse 残留
  // 黑色，永远渲染黑球。自管方式：map + color 成对切换并显式 needsUpdate。
  const basemapTex = useRef<Texture | null>(null);
  const applyBasemap = useCallback(() => {
    const mat = globeMaterial;
    const tex = basemapTex.current;
    if (layers.basemap && tex) {
      mat.map = tex;
      mat.color.set(0xffffff);
    } else {
      mat.map = null;
      mat.color.set(0x000000);
    }
    mat.needsUpdate = true;
  }, [globeMaterial, layers.basemap]);
  const applyBasemapRef = useRef(applyBasemap);
  useEffect(() => {
    applyBasemapRef.current = applyBasemap;
  }, [applyBasemap]);
  useEffect(() => {
    applyBasemap();
  }, [applyBasemap]);
  useEffect(() => {
    const loader = new TextureLoader();
    loader.load("/earth-blue-marble.jpg", (tex) => {
      tex.colorSpace = SRGBColorSpace;
      basemapTex.current = tex;
      applyBasemapRef.current();
    });
  }, []);

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
          globeMaterial={globeMaterial}
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
      <Colorbar />
    </div>
  );
}
