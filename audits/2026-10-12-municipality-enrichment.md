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

## Next batch — 1,513 further backfills (2026-10-12)
- **376** active facilities filled via exact prefecture + municipality-name match to [code4fukui/localgovjp](https://github.com/code4fukui/localgovjp); 6-digit local government codes converted to 5-digit codes by dropping the check digit. Name spaces normalized only for comparison.
- **1,137** filled via 2021 MLIT N03 polygons processed by [smartnews-smri/japan-topography](https://github.com/smartnews-smri/japan-topography), for 01 Hokkaido (395), 03 Iwate (157), 04 Miyagi (141), 24 Mie (216), 42 Nagasaki (111), 46 Kagoshima (117). Each candidate required unique polygon containment, boundary buffer exclusion (~0.0018 degrees), and confirmation that its 5-digit code and municipality name still exist in the current localgovjp reference. Name conflicts were rejected.
- DB metadata provenance: code4fukui_localgovjp_name_exact or N03_2021_smri_polygon_current_code_validated.
- Live post-write check: **997** active records still missing municipality_code (from original 10,713); 376 name-matched + 1,137 2021 polygon-derived + 8,108 2026 polygon-derived + 95 existing-code-matched = **9,716** campaign backfills. Prefecture code prefix mismatches: **0**.
- Caveat: 2021 polygons are historical and simplified; matching the current code list reduces but does not eliminate geographic-change risk. 2026 simplified polygons are also provisional. Full-resolution 2026 polygon validation and review of near-border records are still necessary.

## Further continuation — 2026-10-12
- Starting at 997 missing active municipality codes, **554 additional records were backfilled** in this run; **443 remain** according to the latest live SQL count.
- 214 records: prefecture-matched localgovjp municipality name suffixes after accounting for district (郡) prefixes; metadata localgovjp_district_suffix_match.
- 220 records: exactly one polygon in both simplified N03 2026 and 2021 layers, and same municipality code from both; metadata N03_2026_2021_polygon_agreement. Some prefecture batches were interrupted by per-call tool limits, and their successful partial updates are included in the live count.
- 92 records: 2021 polygon single containment with a municipality code and name still present in the current localgovjp reference, in prefectures 01,03,04,24,42,46; metadata N03_2021_polygon_single_match_current_code. These are provisional because administrative boundaries can change.
- 28 additional dual-year polygon agreement updates occurred in subsequent prefecture batches before tool limits interrupted processing; the 220 total dual-year count includes these.
- Final live check: 443 remaining, municipality_code / prefecture_code prefix mismatch **0**.
- **Do not force the remaining 443 records to a single municipality.** Some represent national parks and world heritage sites spanning municipalities, others are railway points near boundaries or simplified polygon gaps. The next step is high-resolution official N03 point-in-polygon with manual review of conflicts, and a multi-municipality relation for genuinely multi-area facilities.

## Latest continuation — 2026-10-12
- Started from 443 active places missing municipality_code.
- Continued 2026/2021 N03 simplified polygon agreement spatial joins across remaining prefectures; updated **160** more active places. Per-tool execution limits interrupted some prefecture batches; the DB count includes successful writes only.
- Verified latest remaining **283**: railway 242, national-park 22, world-heritage 10, roadside-station 5, airport 3, zoo 1.
- Verified municipality_code vs prefecture_code prefix mismatches: **0**.
- Total filled since original 10,713 missing: **10,430** (97.36%).
- No municipality codes assigned to ambiguous/multi-jurisdiction facilities merely to make NULL count zero. Remaining cases require full-resolution N03 2026 geometry, specific source verification, and multi-municipality data modeling for large-area facilities.

## Next full-resolution triage attempt — 2026-10-12
- Started with 283 active places missing municipality_code.
- Updated 7 records by manually reviewing address and localgovjp municipality code reference: 伊丹空港 (id 15, pref 27/code 27203), 中標津空港 (43/01692), 北大東空港 (86/47358), 道の駅小清水 (1303/01547), 道の駅かみしほろ (1360/01633), 道の駅なかとさ (2312/39401), 宇津ノ谷峠 (1916/22102). For 伊丹空港 also restored missing prefecture_code=27 based on the supplied address. 宇津ノ谷峠 municipality_name retains a dual-city label; code reflects its listed address in 静岡市駿河区, not all geographic coverage.
- Updated 2 records using published government municipal code references: 道の駅ゆすはら (2293/39405; Kochi Prefecture document) and 浜松市動物園 (2559/22138; Hamamatsu City 2024 ward reorganization notice).
- Final DB query: **274 missing**, **0 prefix mismatches**. Original missing 10,713; filled 10,439 (97.44%).
- 274 are unresolved, not completed. In particular railway station coordinates have only prefecture-level addresses and blank municipality_name, so automatic name matching cannot fix them. Several national parks/world heritage sites are multi-jurisdictional and should not be assigned arbitrary single codes.
