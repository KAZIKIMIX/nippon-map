import type {MetadataRoute} from "next";
export default function sitemap():MetadataRoute.Sitemap {
 return ["/","/guides/aquarium","/guides/zoo","/guides/roadside-station"].map(path=>({url:"https://nippon-map.vercel.app"+path,lastModified:"2026-10-09"}));
}
