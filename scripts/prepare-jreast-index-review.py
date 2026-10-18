#!/usr/bin/env python3
"""Convert discovered JR East index URLs into a reviewable station evidence table.

This tool never fabricates station IDs and never writes to Supabase.
Only URLs discovered in existing search-index artifacts are considered.
"""
import csv
import json
import re
import sys
from pathlib import Path

def normalize(s):
    return re.sub(r"\s+", "", str(s or "")).replace("ヶ", "ケ")

def main():
    stations = json.loads(Path(sys.argv[1]).read_text())
    candidates = json.loads(Path(sys.argv[2]).read_text())
    out = Path(sys.argv[3])
    out.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    seen = set()
    for station in stations:
        for item in candidates:
            url = item.get("url", "")
            snippet = item.get("snippet", "")
            if not re.fullmatch(r"https://timetables\.jreast\.co\.jp/timetable/list\d+\.html", url):
                continue
            if not re.search(r"(?<![一-龥ぁ-んァ-ヶA-Za-z0-9])" + re.escape(normalize(station["name"])) + r"(?![一-龥ぁ-んァ-ヶA-Za-z0-9])", normalize(snippet)):
                continue
            if station["prefecture_name"] not in snippet:
                continue
            key = (station["id"], url)
            if key in seen:
                continue
            seen.add(key)
            rows.append({
                "id": station["id"],
                "name": station["name"],
                "prefecture": station["prefecture_name"],
                "routes": "|".join(station.get("routes", [])),
                "candidate_url": url,
                "source_query": item.get("search_query", ""),
                "evidence_snippet": snippet[:350],
                "status": "REVIEW_REQUIRED",
            })
    with out.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "prefecture", "routes", "candidate_url", "source_query", "evidence_snippet", "status"])
        writer.writeheader()
        writer.writerows(rows)
    print(json.dumps({"stations": len(stations), "indexed_records": len(candidates), "review_candidates": len(rows), "output": str(out)}))

if __name__ == "__main__":
    main()
