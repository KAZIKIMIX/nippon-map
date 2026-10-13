# Railway name enrichment, second batch — 2026-10-13

Production DB updated: 722 railway rows whose municipality_name was blank. Matched known municipality_code to a unique municipality-name reference after normalization of county-name prefix (`郡`). Matched prefecture-code prefix and recorded `metadata.municipality_name_enrichment=normalized_county_consensus_2026_10_13`.

Verified after update: marker count 722, railway municipality_name blank 2,434, municipality_code NULL across all categories 274, prefecture-prefix mismatches 0. Of 9,046 railway stations, 6,612 now have municipality_name (73.1%).

Total railway names filled across previous and current batches: 5,879 (2,919 + 857 + 1,381 + 722).

Caution: This uses internally consistent source data, not external authoritative municipality master. Original street addresses and uncoded municipalities have not been changed. Review county-name variants and historical boundary changes against official reference data.
