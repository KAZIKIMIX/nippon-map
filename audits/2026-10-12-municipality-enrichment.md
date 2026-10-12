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

## Continuation — spatial bulk backfill
- Data: 2026-01-01 N03 administrative boundaries, simplified 5% by [ricewin/simplify-japan-geojson](https://github.com/ricewin/simplify-japan-geojson), based on [MLIT N03 2026](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2026.html). Simplification excludes small islands and is **not suitable for boundary-adjacent assignments**.
- Spatial join required **exactly one containing municipality polygon**, rejected points within ~0.0018 degrees of any polygon boundary (scaled longitude), and rejected existing municipality-name conflicts.
- Set municipality_code, missing municipality_name, updated_at, and metadata.municipality_code_enrichment=N03_2026_simplified_polygon_safe_interior.
- **5,900 rows actually updated** across prefectures 02,05–08,09–12,13–23,25–29. Prefectures 03,04,24 were skipped because the selected upstream file returned empty content; others not yet processed.
- Previously backfilled by known-name match: 95 rows. Total current backfilled in this campaign: **5,995**.
- Live post-write checks: remaining missing municipality_code **4,718** (from 10,713); municipality code/prefecture prefix mismatch **0**; coded records without municipality_name **0**.
- **Important:** these 5,900 are *provisional polygon-derived assignments*, not independently validated against full-resolution official polygons. Before calling them authoritative, compare to the original full-resolution 2026 N03 data and inspect edge/railway-station anomalies. Preserve metadata provenance for rollback.

## Next batch — 2,208 further polygon-derived backfills
- Executed live spatial joins for prefectures 30–47, except unavailable/empty source files 42 and 46. The earlier processing for 30–35 and 36–40 completed before tool-call limits; 41,43–45,47 were subsequently processed.
- Same conservative criteria as previous batch: unique polygon containment, exclusion near simplified boundaries, reject municipality-name conflicts, provenance marker in metadata.
- Verified current totals: **8,108** provisional polygon-derived rows + **95** exact-name-matched rows = **8,203** rows backfilled in campaign.
- Remaining municipality_code NULL in active places: **2,510** (originally 10,713).
- Current municipality_code / prefecture_code prefix mismatches: **0**.
- Next priorities: empty/unavailable GeoJSON files (03,04,24,42,46), Hokkaido (01), boundary-adjacent and multi-municipality cases. These require alternate/full-resolution authoritative boundary sources, not guessed codes.
