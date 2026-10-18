#!/usr/bin/env python3
"""Collect JR East station timetable URLs from public search indexes.
Search snippets are candidates, not evidence of live HTTP 200; never auto-update DB.
"""
import requests,re,json,html,time,random
from pathlib import Path
from urllib.parse import quote,unquote,urlparse,parse_qs
from bs4 import BeautifulSoup
P=Path("jreast-batch-results");P.mkdir(exist_ok=True)
allstations=json.loads(Path("scripts/data/jreast-missing-20261019.json").read_text())
# Snapshot may include stations since registered; always recheck live DB before updating.
stations=allstations
groups={}
for s in stations:
 for route in s.get("routes",[]):
  key=(s["prefecture_name"],route)
  groups.setdefault(key,[]).append(s)
# Prioritize large prefecture/route clusters. Cap queries to avoid overloading search providers.
queries=[]
for (pref,route),ss in sorted(groups.items(),key=lambda x:-len(x[1])):
 if len(ss)<2:continue
 queries.append(f'site:timetables.jreast.co.jp/timetable/list {pref} {route} JR東日本')
 if len(queries)>=180:break
# Additional prefecture-level queries for coverage
for pref in sorted(set(s["prefecture_name"] for s in stations)):
 queries.append(f'site:timetables.jreast.co.jp/timetable/list {pref} 駅')
# Individual search queries for stations not covered by broad listings
for s in stations[:180]:
 queries.append(f'site:timetables.jreast.co.jp/timetable/list {s["name"]} {s["prefecture_name"]}')
queries=queries[:400]
session=requests.Session()
session.headers.update({"User-Agent":"Mozilla/5.0 (compatible; NipponMapResearch/1.0)"})
records=[];seen=set()
for i,q in enumerate(queries):
 engine="bing" if i%2 else "google"
 url=("https://www.bing.com/search?q=" if engine=="bing" else "https://www.google.com/search?q=")+quote(q)
 try:
  r=session.get(url,timeout=18)
  if r.status_code!=200:print("SEARCH_ERROR",i,r.status_code);continue
  soup=BeautifulSoup(r.text,"html.parser")
  candidates=[]
  for a in soup.select("a[href]"):
   href=html.unescape(unquote(a.get("href","")))
   # URL may be wrapped in google's /url?q=... form
   if href.startswith("/url?"):
    p=parse_qs(urlparse(href).query);href=(p.get("q") or p.get("url") or [""])[0]
   for m in re.finditer(r'https?://timetables\.jreast\.co\.jp/timetable/list\d+\.html',href):
    link=m.group(0).replace("http:","https:")
    parent=a.find_parent(["div","li"]) or a
    snippet=parent.get_text(" ",strip=True)[:450]
    candidates.append((link,snippet))
  for link,snippet in candidates:
   key=(link,q)
   if key in seen:continue
   seen.add(key)
   records.append({"url":link,"search_query":q,"search_engine":engine,"snippet":snippet,"retrieved_status":r.status_code})
  if i%25==0:print("SEARCH_PROGRESS",i,len(queries),"RESULTS",len(records),flush=True)
 except Exception as e:print("SEARCH_ERROR",i,str(e)[:110],flush=True)
 time.sleep(.18)
(P/"indexed-candidates.json").write_text(json.dumps(records,ensure_ascii=False,indent=2))
print("INDEXED_CANDIDATES",len(records),"UNIQUE_URLS",len({r["url"] for r in records}),"QUERIES",len(queries),flush=True)
