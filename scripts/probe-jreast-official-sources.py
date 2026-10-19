#!/usr/bin/env python3
"""Read-only availability probe of verified JR East official reference pages.
These are source candidates, not evidence that every station is listed.
"""
import csv, sys
from pathlib import Path
import requests

sources=[
 ("official_route_map","https://www.jreast.co.jp/map/"),
 ("official_route_map_tohoku_pdf","https://www.jreast.co.jp/map/pdf/tohoku.pdf"),
 ("official_route_list","https://www.jreast.co.jp/estation/facility_search.aspx?searchCategoryCd=1"),
 ("official_factbook_2026","https://www.jreast.co.jp/company/ir/library/factbook/pdf/data.pdf"),
]
out=Path(sys.argv[1] if len(sys.argv)>1 else "jreast-batch-results/official-source-probe.csv")
out.parent.mkdir(parents=True,exist_ok=True)
rows=[]
for name,url in sources:
    row={"source":name,"url":url,"http_status":"","bytes":0,"content_type":"","error":""}
    try:
        response=requests.get(url,timeout=15,headers={"User-Agent":"Mozilla/5.0"},allow_redirects=True)
        row.update(http_status=response.status_code,bytes=len(response.content),content_type=response.headers.get("Content-Type",""))
    except requests.RequestException as exc:
        row["error"]=str(exc)[:160]
    rows.append(row)
    print(row,flush=True)
with out.open("w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]))
    w.writeheader()
    w.writerows(rows)
print("SUCCESSFUL_SOURCES",sum(r["http_status"]==200 for r in rows))
