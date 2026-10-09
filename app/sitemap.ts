import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://nippon-map.vercel.app/", lastModified: "2026-10-09" }];
}
