#!/usr/bin/env python3
"""Find JR East timetable station URLs from third-party indexed sitemaps (not JR East CGI).
No URL is considered verified merely because it was indexed.
"""
import requests,re,xml.etree.ElementTree as ET,json,time
from pathlib import Path
from urllib.parse import urlparse
O=Path("jreast-batch-results");O.mkdir(exist_ok=True)
S=requests.Session();S.headers["User-Agent"]="NipponMapResearch/1.0"
sources=[
 "https://timetables.jreast.co.jp/robots.txt",
 "https://timetables.jreast.co.jp/sitemap.xml",
 "https://www.jreast.co.jp/robots.txt",
 "https://www.jreast.co.jp/sitemap.xml",
 "https://www.google.com/search?q=site%3Atimetables.jreast.co.jp%2Ftimetable%2Flist+%E9%A7%85",
 "https://www.bing.com/search?q=site%3Atimetables.jreast.co.jp%2Ftimetable%2Flist"
]
results=[]
for url in sources:
 try:
  r=S.get(url,timeout=18)
  body=r.text[:1500000]
  urls=sorted(set(re.findall(r'https://timetables\.jreast\.co\.jp/timetable/list\d+\.html',body)))
  results.append({"source":url,"status":r.status_code,"length":len(r.content),"station_urls":urls[:3000],"preview":re.sub(r'\s+',' ',body[:180])})
  print("SOURCE",r.status_code,len(r.content),len(urls),url)
 except Exception as e:
  results.append({"source":url,"error":str(e)[:140]});print("ERROR",str(e)[:100],url)
(O/"discovery.json").write_text(json.dumps(results,ensure_ascii=False,indent=2))
