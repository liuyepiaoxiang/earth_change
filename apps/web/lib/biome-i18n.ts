/** engine classifyBiome 返回中文群系名——UI 层按 locale 映射显示 */
const BIOME_EN: Record<string, string> = {
  "冰雪": "Ice",
  "苔原": "Tundra",
  "针叶林": "Boreal forest",
  "荒漠": "Desert",
  "温带森林": "Temperate forest",
  "草原": "Grassland",
  "亚热带森林": "Subtropical forest",
  "稀树草原": "Savanna",
  "热带森林": "Tropical forest",
};

export function biomeName(zh: string, locale: "zh" | "en"): string {
  return locale === "en" ? (BIOME_EN[zh] ?? zh) : zh;
}
