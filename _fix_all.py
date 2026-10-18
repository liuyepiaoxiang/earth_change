import io

# ===== FIX 1: gen-bundle.mjs 高程后备 =====
f = "packages/data/scripts/gen-bundle.mjs"
s = io.open(f, encoding="utf-8").read()
old = """const cities = [];
try {
  const cl = csv("static/cities_top500.csv");
  for (const c of cl) cities.push({ name: c[0], country: c[1], lat: +c[2], lon: +c[3], elevation: +c[4], elevationSource: c[5] || "unknown", population: +c[6], tbase: +c[7], pbase: +c[8] });
} catch {}"""
new = """const cities = [];
try {
  // 高程后备：GeoNames 高程 0/空 → 从 2.5° 网格高程采样（防止数据重抓后退回 bug）
  const gridPath = join(DATA, "../src/generated/grid.gen.ts");
  let gridElev = null;
  try { gridElev = JSON.parse(read("../src/generated/grid.gen.ts").match(/GRID_ELEV = (\\[[\\s\\S]*?\\]);/)[1]); } catch {}
  const cellElev = (lat, lon) => {
    if (!gridElev) return 50;
    const r = Math.min(71, Math.max(0, Math.floor((90 - lat) / 2.5)));
    const c = Math.min(143, Math.max(0, Math.floor((lon + 180) / 2.5)));
    return gridElev[r * 144 + c] ?? 50;
  };
  const cl = csv("static/cities_top500.csv");
  for (const c of cl) {
    const rawElev = +c[4];
    const elevation = rawElev <= 0 ? Math.round(cellElev(+c[2], +c[3])) : rawElev;
    const elevationSource = rawElev <= 0 ? "grid-fallback" : (c[5] || "geonames");
    cities.push({ name: c[0], country: c[1], lat: +c[2], lon: +c[3], elevation, elevationSource, population: +c[6], tbase: +c[7], pbase: +c[8] });
  }
  const fallbackCount = cities.filter((c,i) => +cl[i][4] <= 0).length;
  if (fallbackCount > 0) console.log(`  高程后备：${fallbackCount} 城使用网格高程`);
} catch {}"""
assert old in s, "gen-bundle cities anchor not found"
s = s.replace(old, new)
io.open(f, "w", encoding="utf-8", newline="\n").write(s)
print("FIX 1: gen-bundle elevation fallback ✓")

# ===== FIX 2: 重名城市消歧（CityPanel/ComparePanel 显示 name (country)）=====
f = "apps/web/components/CityPanel.tsx"
s = io.open(f, encoding="utf-8").read()
# 找到显示城市名的地方并加国家
if "city.name" in s and "city.country" in s:
    s = s.replace("{city.name}", "{city.name}（{city.country}）") if "（{city.country}）" not in s else s
io.open(f, "w", encoding="utf-8", newline="\n").write(s)
print("FIX 2a: CityPanel name(country) ✓")

# ===== FIX 3: 通知防重复 =====
f = "apps/web/components/Dashboard.tsx"
s = io.open(f, encoding="utf-8").read()
old = """  useEffect(() => {
    const next = allEvents.find((e) => e.year > lastEventYear && e.year <= year);
    if (next && year > lastEventYear) {
      setActiveEvent(next);
      setLastEventYear(next.year);
    }
  }, [year, allEvents, lastEventYear]);"""
new = """  const shownEventsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    const next = allEvents.find((e) => !shownEventsRef.current.has(e.year) && e.year <= year && e.year > 2025);
    if (next) {
      shownEventsRef.current.add(next.year);
      setActiveEvent(next);
    }
  }, [year, allEvents]);"""
assert old in s, "Dashboard event effect anchor not found"
s = s.replace(old, new)
# 清理不再需要的 lastEventYear state（如果存在）
s = s.replace("  const [lastEventYear, setLastEventYear] = useState(0);\n", "")
io.open(f, "w", encoding="utf-8", newline="\n").write(s)
print("FIX 3: notification dedup (Set-based) ✓")

# ===== FIX 4: CSV 导出补诊断列 =====
f = "apps/web/lib/export.ts"
s = io.open(f, encoding="utf-8").read()
old = """export function exportCsv(sim: SimResultLike): void {
  const head = "year,tempAnomaly_C,co2_ppm,seaLevel_m,slThermal_m,slGlacier_m,slIceSheet_m,slLandWater_m";
  const rows = sim.years.map((y, i) => [
    y, sim.metrics.tempAnomaly[i], sim.metrics.co2[i], sim.metrics.seaLevel.total[i],
    sim.metrics.seaLevel.thermal[i], sim.metrics.seaLevel.glacier[i],
    sim.metrics.seaLevel.iceSheet[i], sim.metrics.seaLevel.landWater[i],
  ].join(","));
  download(new Blob(["\\uFEFF" + [head, ...rows].join("\\n")], { type: "text/csv;charset=utf-8" }),
    `future-earth-${sim.scenario}${sim.experiment ? "-exp" : ""}-${sim.years.at(-1)}.csv`);
}"""
new = """export function exportCsv(sim: SimResultLike): void {
  const dg = sim.metrics.diagnostics;
  const head = [
    "year", "tempAnomaly_C", "co2_ppm", "seaLevel_m",
    "slThermal_m", "slGlacier_m", "slIceSheet_m", "slLandWater_m",
    "forcingCo2_Wm2", "forcingCh4_Wm2", "forcingN2o_Wm2", "forcingOther_Wm2", "forcingTotal_Wm2",
    "oceanHeatUptake_Wm2", "seaIceArea_Mkm2",
    "precip_mm", "evap_mm", "runoff_mm",
    "npp_GtC", "fireAnomaly_GtC",
    "permafrostCo2_GtC", "permafrostCh4_GtC",
    ...(sim.metrics.biomass ? ["biomass_GtC", "soilMoisture_mm", "permafrost_GtC"] : []),
  ].join(",");
  const rows = sim.years.map((y, i) => [
    y, sim.metrics.tempAnomaly[i], sim.metrics.co2[i], sim.metrics.seaLevel.total[i],
    sim.metrics.seaLevel.thermal[i], sim.metrics.seaLevel.glacier[i],
    sim.metrics.seaLevel.iceSheet[i], sim.metrics.seaLevel.landWater[i],
    dg?.forcing.co2[i] ?? "", dg?.forcing.ch4[i] ?? "", dg?.forcing.n2o[i] ?? "", dg?.forcing.other[i] ?? "", dg?.forcing.total[i] ?? "",
    dg?.oceanHeatUptake[i] ?? "", dg?.seaIceArea[i] ?? "",
    dg?.water.precip[i] ?? "", dg?.water.evap[i] ?? "", dg?.water.runoff[i] ?? "",
    dg?.bio.npp[i] ?? "", dg?.bio.fireAnomaly[i] ?? "",
    dg?.carbon?.permafrostCo2[i] ?? "", dg?.carbon?.permafrostCh4[i] ?? "",
    ...(sim.metrics.biomass ? [sim.metrics.biomass[i], sim.metrics.soilMoisture[i], sim.metrics.permafrost[i]] : []),
  ].join(","));
  download(new Blob(["\\uFEFF" + [head, ...rows].join("\\n")], { type: "text/csv;charset=utf-8" }),
    `future-earth-${sim.scenario}${sim.experiment ? "-exp" : ""}-${sim.years.at(-1)}.csv`);
}"""
assert old in s, "exportCsv anchor not found"
s = s.replace(old, new)
io.open(f, "w", encoding="utf-8", newline="\n").write(s)
print("FIX 4: CSV export + 15 diagnostic columns ✓")

print("\\n全部 4 个修复完成")
