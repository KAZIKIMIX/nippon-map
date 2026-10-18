#!/usr/bin/env python3
"""Read-only: verify JR East station rows from live official route listings.
Never writes to Supabase; review output before any DB update.
"""
import csv, json, re, sys, time
from pathlib import Path
import requests
from bs4 import BeautifulSoup

stations=json.loads(Path(sys.argv[1] if len(sys.argv)>1 else "scripts/data/jreast-missing-20261019.json").read_text())
out=Path(sys.argv[2] if len(sys.argv)>2 else "jreast-batch-results/official-route-evidence.csv")
out.parent.mkdir(parents=True,exist_ok=True)
sess=requests.Session()
sess.headers["User-Agent"]="Mozilla/5.0 (compatible; NipponMapResearch/1.0)"
matches={}
failed=[]
for code in range(1,101):
    url=f"https://timetables.jreast.co.jp/cgi-bin/st_search.cgi?rosen={code}"
    try:
        resp=sess.get(url,timeout=12)
        if resp.status_code!=200:
            failed.append((code,resp.status_code))
            continue
        soup=BeautifulSoup(resp.content,"html.parser")
        for tr in soup.select("tr"):
            cells=[c.get_text(" ",strip=True) for c in tr.select("td")]
            if len(cells)<3: continue
            official_name=re.sub(r"[（(].*$","",cells[0]).strip()
            prefecture=cells[1].strip()
            route_text=cells[2]
            for station in stations:
                if station["name"].removesuffix("駅")!=official_name or station["prefecture_name"]!=prefecture:
                    continue
                common=[route for route in station.get("routes",[]) if route in route_text]
                if not common: continue
                matches[(station["id"],url)]=dict(id=station["id"],name=station["name"],prefecture=prefecture,matched_routes="|".join(common),official_route_text=route_text,official_url=url,status="LIVE_OFFICIAL_ROUTE_ROW_MATCH_REVIEW_DB")
    except requests.RequestException as exc:
        failed.append((code,str(exc)[:100]))
    time.sleep(.15)
fields=["id","name","prefecture","matched_routes","official_route_text","official_url","status"]
with out.open("w",newline="",encoding="utf-8") as f:
    writer=csv.DictWriter(f,fieldnames=fields)
    writer.writeheader()
    writer.writerows(matches.values())
print(json.dumps(dict(official_route_matches=len(matches),unique_station_ids=len({x[0] for x in matches}),failed_pages=failed[:30],output=str(out)),ensure_ascii=False))
