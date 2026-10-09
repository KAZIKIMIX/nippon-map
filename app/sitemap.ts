export const dynamic="force-dynamic";
import type {MetadataRoute} from "next";
import {guideCategories,groupGuidePlaces} from "../lib/guide-categories";
import {getGuidePlaces} from "../lib/guide-data";
const base="https://nippon-map.vercel.app";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const paths=["/","/guides/aquarium","/guides/zoo","/guides/roadside-station"];
 for(const category of Object.keys(guideCategories) as (keyof typeof guideCategories)[]){
  try{
   const groups=groupGuidePlaces(await getGuidePlaces(category));
   for(const group of groups)paths.push("/guides/"+category+"/"+encodeURIComponent(group.prefecture));
  }catch{ /* Keep the base sitemap available during a temporary data outage. */ }
 }
 return [...new Set(paths)].map(path=>({url:base+path,changeFrequency:path==="/"?("weekly" as const):("monthly" as const),priority:path==="/"?1:path.split("/").length===3?0.8:0.6}));
}
