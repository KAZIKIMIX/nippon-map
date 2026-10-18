#!/usr/bin/env python3
"""JR East bulk official listing collector and conservative Supabase updater.
Requires requests and beautifulsoup4. Never guesses station codes.
"""
import os,re,json,time,sys
from pathlib import Path
from urllib.parse import urljoin,urlparse
import requests
from bs4 import BeautifulSoup

OUT=Path("jreast-batch-results"); OUT.mkdir(exist_ok=True)
BASE=os.environ.get("SUPABASE_URL","").rstrip("/")
KEY=os.environ.get("SUPABASE_SERVICE_ROLE_KEY","")
DRY=os.environ.get("JREAST_DRY_RUN","true").lower()!="false"
session=requests.Session(); session.headers.update({"User-Agent":"NipponMapResearch/1.0 (official station directory verification)"})
def norm(s): return re.sub(r"\s+","",str(s or "").replace("駅","")).replace("ヶ","ケ").replace("ヵ","カ")
def fetch(url):
 try:
  r=session.get(url,timeout=20);r.raise_for_status();return r
 except requests.RequestException as e: print("FETCH_ERROR",url,str(e)[:150]);return None
def db_get(path,params):
 if not BASE or not KEY: return []
 h={"apikey":KEY,"Authorization":"Bearer "+KEY}
 try:
  r=session.get(BASE+"/rest/v1/"+path,params=params,headers=h,timeout=30);r.raise_for_status();return r.json()
 except Exception as e: print("DB_GET_ERROR",str(e)[:200]);return []
def stations():
 snapshot=os.environ.get("JREAST_STATIONS_FILE")
 if snapshot and Path(snapshot).exists():
  data=json.loads(Path(snapshot).read_text())
  return [{"id":p["id"],"name":p["name"],"prefecture_name":p["prefecture_name"],"metadata":{"routes":p.get("routes",[]),"operators":p.get("operators",[])},"official_url":p.get("official_url")} for p in data]
 cats=db_get("categories",{"select":"id","slug":"eq.railway"})
 if not cats: return []
 result=[]
 for offset in range(0,20000,1000):
  chunk=db_get("places",{"select":"id,name,prefecture_name,metadata,official_url,is_active","category_id":"eq."+str(cats[0]["id"]),"limit":1000,"offset":offset})
  if not chunk:break
  for p in chunk:
   if p.get("is_active") and "東日本旅客鉄道" in p.get("metadata",{}).get("operators",[]) and not (p.get("official_url") or "").strip():result.append(p)
  if len(chunk)<1000:break
 return result
def official_listing():
 results=[];seen=set()
 # Route-based directory queries cover all official routes more reliably than ten kana initials.
 # Only observed rows with a real station-specific link are eligible for matching.
 route_ids=os.environ.get("JREAST_ROUTE_IDS")
 if route_ids:
  ids=[int(x.strip()) for x in route_ids.split(",") if x.strip().isdigit()]
 else:
  ids=list(range(1,121))
 consecutive_empty=0
 for route_id in ids:
  url=f"https://timetables.jreast.co.jp/cgi-bin/st_search.cgi?rosen={route_id}"
  r=fetch(url)
  if not r:continue
  soup=BeautifulSoup(r.content,"html.parser")
  found=0
  for tr in soup.select("tr"):
   cells=tr.find_all(["td","th"],recursive=False)
   if len(cells)<3:continue
   name=re.sub(r"[（(].*","",cells[0].get_text(" ",strip=True)).strip()
   pref=cells[1].get_text(" ",strip=True)
   routes=cells[2].get_text(" ",strip=True)
   if not name or not pref.endswith(("都","道","府","県")):continue
   link=cells[0].find("a",href=True)
   station_url=urljoin(r.url,link["href"]) if link else None
   if station_url and urlparse(station_url).hostname!="timetables.jreast.co.jp":station_url=None
   record={"name":name,"prefecture_name":pref,"routes_text":routes,"source_url":r.url,"url":station_url or r.url,"has_station_link":bool(station_url),"route_id":route_id}
   k=(name,pref,record["url"])
   if k not in seen:seen.add(k);results.append(record)
   found+=1
  consecutive_empty=consecutive_empty+1 if found==0 else 0
  print("ROUTE",route_id,"ROWS",found)
  time.sleep(0.6)
 return results

def main():
 missing=stations()
 print("MISSING",len(missing))
 if not missing:
  print("No DB credentials or no missing stations; stop safely")
  return 2
 official=official_listing()
 (OUT/"official.json").write_text(json.dumps(official,ensure_ascii=False,indent=2))
 print("OFFICIAL_RECORDS",len(official))
 matched=[];review=[]
 for p in missing:
  opts=[x for x in official if norm(x["name"])==norm(p["name"]) and x["prefecture_name"]==p["prefecture_name"] and any(norm(route) in norm(x["routes_text"]) or norm(x["routes_text"]) in norm(route) for route in p.get("metadata",{}).get("routes",[]) if route)]
  urls=set(x["url"] for x in opts)
  if len(urls)!=1:
   review.append({"id":p["id"],"name":p["name"],"reason":"ambiguous" if urls else "no_official_match","candidate_count":len(opts)})
   continue
  x=opts[0]
  # A shared search results URL must not be used as station-specific URL.
  if not x["has_station_link"]:
   review.append({"id":p["id"],"name":p["name"],"reason":"no_station_specific_link"})
   continue
  matched.append({"id":p["id"],"name":p["name"],"prefecture_name":p["prefecture_name"],"official_url":x["url"],"source_url":x["source_url"],"evidence":"Official timetable listing: matching station, prefecture and route"})
 (OUT/"verified.json").write_text(json.dumps(matched,ensure_ascii=False,indent=2))
 (OUT/"review.json").write_text(json.dumps(review,ensure_ascii=False,indent=2))
 print("MATCHED",len(matched),"REVIEW",len(review),"DRY_RUN",DRY)
 if DRY:return 0
 h={"apikey":KEY,"Authorization":"Bearer "+KEY,"Content-Type":"application/json","Prefer":"return=representation"}
 success=0
 for x in matched:
  # Recheck emptiness immediately before update; never overwrite a populated URL.
  current=db_get("places",{"select":"id,name,prefecture_name,official_url","id":"eq."+str(x["id"])})
  if len(current)!=1 or current[0]["name"]!=x["name"] or current[0]["prefecture_name"]!=x["prefecture_name"] or (current[0].get("official_url") or "").strip():continue
  try:
   r=session.patch(BASE+"/rest/v1/places",params={"id":"eq."+str(x["id"]),"official_url":"is.null"},headers=h,json={"official_url":x["official_url"]},timeout=25)
   r.raise_for_status();success+=len(r.json())
  except Exception as e:print("UPDATE_ERROR",x["id"],str(e)[:150])
 print("DB_UPDATED",success)
 return 0
if __name__=="__main__":sys.exit(main())
