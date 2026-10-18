#!/usr/bin/env python3
"""Read-only JR East official facility-list station candidate collector.
Facility listings establish route+station only, NOT prefecture; never auto-register.
"""
import csv, json, re, sys
from pathlib import Path
import requests
from bs4 import BeautifulSoup

stations=json.loads(Path(sys.argv[1] if len(sys.argv)>1 else "scripts/data/jreast-missing-20261019.json").read_text())
out=Path(sys.argv[2] if len(sys.argv)>2 else "jreast-batch-results/facility-candidates.csv")
out.parent.mkdir(parents=True,exist_ok=True)
url="https://www.jreast.co.jp/estation/facility_result.aspx?SearchCategoryCd=4&mode=2&rosen=34%3D1%3D%E5%B8%B8%E7%A3%90%E7%B7%9A"
response=requests.get(url,timeout=20,headers={"User-Agent":"Mozilla/5.0"})
print("HTTP_STATUS",response.status_code,flush=True)
response.raise_for_status()
soup=BeautifulSoup(response.content,"html.parser")
heading=soup.find(string=re.compile("常磐線の駅"))
if not heading:
    raise RuntimeError("Expected official route heading missing")
official_names=set()
for tr in soup.select("tr"):
    cells=tr.select("td")
    if not cells: continue
    name=cells[0].get_text(" ",strip=True).removesuffix("駅").strip()
    if name: official_names.add(name)
rows=[]
for s in stations:
    if s["name"].removesuffix("駅") in official_names and "常磐線" in s.get("routes",[]):
        rows.append({"id":s["id"],"name":s["name"],"prefecture_db":s["prefecture_name"],"route":"常磐線","official_url":url,"status":"CANDIDATE_PREFECTURE_NOT_VERIFIED"})
with out.open("w",newline="",encoding="utf-8") as f:
    writer=csv.DictWriter(f,fieldnames=["id","name","prefecture_db","route","official_url","status"])
    writer.writeheader()
    writer.writerows(rows)
print(json.dumps({"official_station_names":len(official_names),"candidates":len(rows),"prefecture_verified":0,"output":str(out)},ensure_ascii=False))
