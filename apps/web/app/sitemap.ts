import type { MetadataRoute } from "next";
import { loadCities } from "@future-earth/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://earth-change.vercel.app";
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/overview`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/ask`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/learn/ssp-scenarios`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/learn/sea-level-rise`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/learn/cities-underwater`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/legal`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
  // 审计 SEO-02：全量 500 城入 sitemap（原先仅前 50 → 450 城零发现渠道）；embed 为可嵌入视图，不入索引
  const cityPages: MetadataRoute.Sitemap = loadCities()
    .map((c) => ({
      url: `${base}/city/${c.name.toLowerCase().replace(/\s+/g, "-")}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  return [...staticPages, ...cityPages];
}
