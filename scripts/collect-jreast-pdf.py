#!/usr/bin/env python3
"""Extract JR East's official station roster PDF; create evidence-backed PDF candidates."""
import json,re,requests,io,sys
from pathlib import Path
from pypdf import PdfReader
PDF="https://www.jreast.co.jp/suica/corporate/suicadata/pdf/ekikarte_targetstations.pdf"
OUT=Path("jreast-batch-results");OUT.mkdir(exist_ok=True)
stations=json.loads(Path("scripts/data/jreast-missing-20261019.json").read_text())
try:
 r=requests.get(PDF,timeout=40,headers={"User-Agent":"Mozilla/5.0"});r.raise_for_status()
 if not r.content.startswith(b"%PDF"):raise ValueError("Not PDF")
 pages=[p.extract_text(extraction_mode="layout") or "" for p in PdfReader(io.BytesIO(r.content)).pages]
except Exception as e:
 print("OFFICIAL_PDF_ERROR",str(e));(OUT/"pdf-candidates.json").write_text("[]");sys.exit(2)
print("OFFICIAL_PDF_PAGES",len(pages))
def norm(x):return re.sub(r"\s+","",str(x or "")).replace("ヶ","ケ").replace("ヵ","カ").replace("駅","")
candidates=[]
for s in stations:
 for i,page in enumerate(pages):
  # Explicitly require station and prefecture in same printed row.
  rows=page.splitlines()
  matches=[line for line in rows if norm(s["name"]) in norm(line) and s["prefecture_name"] in line]
  if not matches:continue
  # Require clear table columns and a unique station token, not substring of another station.
  matches=[line for line in matches if re.search(r"(?<![一-龥ぁ-んァ-ヶ])"+re.escape(s["name"])+r"(?![一-龥ぁ-んァ-ヶ])",line)]
  if len(matches)!=1:continue
  candidates.append({"id":s["id"],"name":s["name"],"prefecture_name":s["prefecture_name"],"routes":s.get("routes",[]),"url":PDF,"source_url":PDF,"http_status":200,"content_verified":True,"station_name_verified":True,"operator_verified":True,"pdf_station_text_verified":True,"evidence":"JR East official station roster PDF page "+str(i+1)+": "+matches[0].strip()[:160]})
  break
(OUT/"pdf-candidates.json").write_text(json.dumps(candidates,ensure_ascii=False,indent=2))
print("OFFICIAL_PDF_MATCHED",len(candidates))
