# Municipality code enrichment — 2026-10-12

## Executed live update
- Starting missing municipality_code: 10,713 active places.
- Matched rows with missing code against existing coded rows using **both** prefecture_code and exact municipality_name; accepted only name/prefecture pairs having one unique code.
- Updated: **95** active places, with updated_at and metadata.municipality_code_enrichment provenance marker.
- Verified missing municipality_code after update: **10,618**.
- Verified mismatches between municipality_code prefix and prefecture_code: **0**.

## Remaining by cause (baseline before update)
- Railway missing: 8,955, including 8,810 without municipality_name.
- Roadside stations missing: 1,234; most other categories have municipality_name but lack a code reference.
- National parks (35) and some world heritage sites (15) lack municipality_name; some span multiple municipalities, and assigning a single code may be misleading.

## Next bulk processing sources
- e-Stat municipal code search/export: https://www.e-stat.go.jp/municipalities/cities/areacode
- Ministry of Internal Affairs municipality codes: https://www.soumu.go.jp/denshijiti/code.html
- MLIT 2026 administrative boundaries N03: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2026.html

Use the current authoritative 5-digit municipality code mapping for all rows with a known municipality name, and spatial joins to 2026 N03 administrative polygons for railway stations without municipality names. Review ambiguous boundary points, city/ward granularity, historical station names and multi-area facilities. Never invent codes from prefecture alone.
