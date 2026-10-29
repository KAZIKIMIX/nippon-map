"use client";
import {classifyUsageSource,usageSources,type UsageEvent,type UsagePayload} from "./usage-events";
const key="nippon-map-usage-disabled";
const developerKey="nippon-map-developer-mode";
const sourceKey="nippon-map-usage-source";
let memorySource:UsagePayload["source"]|null=null;
function clearSource():void {
 memorySource=null;
 try{sessionStorage.removeItem(sourceKey);}catch{}
}
function retainedSource():UsagePayload["source"] {
 const campaign=new URLSearchParams(window.location.search).get("utm_source");
 if(campaign==="x"||campaign==="instagram")memorySource=campaign;
 if(!memorySource){
  const incoming=classifyUsageSource(document.referrer,window.location.origin,null);
  if(incoming!=="direct")memorySource=incoming;
  else {
   try{const stored=sessionStorage.getItem(sourceKey);if(usageSources.includes(stored as UsagePayload["source"]))memorySource=stored as UsagePayload["source"];}catch{}
   memorySource??="direct";
  }
 }
 // Only a coarse enum is retained in this tab, never a URL or visitor ID.
 try{sessionStorage.setItem(sourceKey,memorySource);}catch{}
 return memorySource;
}
export function developerModeEnabled(): boolean {
 if(typeof window==="undefined")return false;
 try{return localStorage.getItem(developerKey)==="1";}catch{return false;}
}
export function setDeveloperMode(enabled:boolean):boolean {
 try{if(enabled)localStorage.setItem(developerKey,"1");else localStorage.removeItem(developerKey);return true;}catch{return false;}
}
let memoryDisabled=false;
export function usageIsDisabled(): boolean {
 if(typeof window==="undefined")return true;
 const nav=navigator as Navigator & {globalPrivacyControl?:boolean};
 if(nav.doNotTrack==="1"||nav.globalPrivacyControl===true||memoryDisabled)return true;
 try{return localStorage.getItem(key)==="1";}catch{return false;}
}
export function setUsageDisabled(disabled: boolean): boolean {
 memoryDisabled=disabled;
 if(disabled)clearSource();
 try{if(disabled)localStorage.setItem(key,"1");else localStorage.removeItem(key);return true;}catch{return false;}
}
export function trackUsage(event: UsageEvent, category: string|null=null): void {
 if(usageIsDisabled()){clearSource();return;}
 const source=retainedSource();
 const developer=developerModeEnabled()||navigator.webdriver===true;
 void fetch("/api/usage",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({event,category,source,developer}),keepalive:true,credentials:"omit"}).catch(()=>{});
}
