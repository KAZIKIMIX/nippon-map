"use client";
import {classifyUsageSource,type UsageEvent} from "./usage-events";
const key="nippon-map-usage-disabled";
let memoryDisabled=false;
export function usageIsDisabled(): boolean {
 if(typeof window==="undefined")return true;
 const nav=navigator as Navigator & {globalPrivacyControl?:boolean};
 if(nav.doNotTrack==="1"||nav.globalPrivacyControl===true||memoryDisabled)return true;
 try{return localStorage.getItem(key)==="1";}catch{return false;}
}
export function setUsageDisabled(disabled: boolean): boolean {
 memoryDisabled=disabled;
 try{if(disabled)localStorage.setItem(key,"1");else localStorage.removeItem(key);return true;}catch{return false;}
}
export function trackUsage(event: UsageEvent, category: string|null=null): void {
 if(usageIsDisabled())return;
 const campaign=new URLSearchParams(window.location.search).get("utm_source");
 const source=classifyUsageSource(document.referrer,window.location.origin,campaign);
 void fetch("/api/usage",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({event,category,source}),keepalive:true,credentials:"omit"}).catch(()=>{});
}
