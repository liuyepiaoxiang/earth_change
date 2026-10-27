import type { MetadataRoute } from "next";
import { loadCities } from "@future-earth/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://earth-change.vercel.app";
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/overview`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/ask`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/learn/ssp-scenarios`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/learn/sea-level-rise`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/learn/cities-underwater`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/embed`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
  const cityPages: MetadataRoute.Sitemap = loadCities()
    .slice(0, 50)
    .map((c) => ({
      url: `${base}/city/${c.name.toLowerCase().replace(/\s+/g, "-")}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  return [...staticPages, ...cityPages];
}
