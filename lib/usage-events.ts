export const usageEvents = ["page_view","category_select","place_open","share_copy"] as const;
export const usageCategories = ["aquarium","zoo","roadside-station","airport","shelter","world-heritage","national-park","railway","museum","park","toilet","castle","lighthouse","hot-spring","botanical-garden","campsite","observation-deck","theme-park","factory-tour","horse-racing","velodrome","sightseeing"] as const;
export const usageSources = ["direct","x","instagram","search","other"] as const;
export type UsageEvent = typeof usageEvents[number];
export type UsagePayload = {event: UsageEvent; category: string|null; source: typeof usageSources[number]};
export function parseUsagePayload(value: unknown): UsagePayload|null {
 if(!value || typeof value!=="object" || Array.isArray(value))return null;
 const v=value as Record<string,unknown>;
 if(Object.keys(v).some(k=>!["event","category","source"].includes(k)))return null;
 if(!usageEvents.includes(v.event as UsageEvent)||!usageSources.includes(v.source as UsagePayload["source"]))return null;
 if(v.category!==null&&!usageCategories.includes(v.category as typeof usageCategories[number]))return null;
 if((v.event==="category_select"||v.event==="place_open")&&v.category===null)return null;
 return {event:v.event as UsageEvent,category:v.category as string|null,source:v.source as UsagePayload["source"]};
}
export function classifyUsageSource(referrer: string, origin: string, campaign: string|null): UsagePayload["source"] {
 if(campaign==="x"||campaign==="instagram")return campaign;
 if(!referrer)return "direct";
 try {
  const url=new URL(referrer);if(url.origin===origin)return "direct";
  const host=url.hostname.toLowerCase();
  if(host==="t.co"||host==="x.com"||host.endsWith(".x.com")||host==="twitter.com"||host.endsWith(".twitter.com"))return "x";
  if(host==="instagram.com"||host.endsWith(".instagram.com"))return "instagram";
  if(host==="google.com"||host.endsWith(".google.com")||host==="google.co.jp"||host.endsWith(".google.co.jp")||host==="bing.com"||host.endsWith(".bing.com")||host==="search.yahoo.co.jp")return "search";
  return "other";
 }catch{return "other";}
}

