import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/mobile-preview.html"] },
    sitemap: "https://nippon-map.vercel.app/sitemap.xml",
  };
}
