import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://earth-change.vercel.app";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/overview`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/embed`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
}
