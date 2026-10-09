import {mapCategories} from "./map-categories";
export type LandingParams=Record<string,string|string[]|undefined>;
export function legacyMapPath(params:LandingParams):string|null {
 const category=Array.isArray(params.category)?params.category[0]:params.category;
 const map=Array.isArray(params.map)?params.map[0]:params.map;
 if(!mapCategories.some(c=>c.slug===category)&&map!=="1")return null;
 const query=new URLSearchParams();
 for(const [key,value] of Object.entries(params)) {
  if(!["category","prefecture","q","place","utm_source","utm_medium","utm_campaign"].includes(key))continue;
  const first=Array.isArray(value)?value[0]:value;
  if(first)query.set(key,first.slice(0,200));
 }
 return "/map"+(query.size?"?"+query.toString():"");
}
