# Railway municipality-name batch update — 2026-10-13

Database: Supabase production, public.places.

Updated 1,381 active railway rows (category_id=8) with missing municipality_name. Required a known municipality_code matching prefecture_code, one unique existing non-empty municipality name for that code, and an airport or roadside-station record supplying that name. Stored metadata marker `municipality_name_enrichment=single_airport_roadside_reference_2026_10_13`.

Post-update verification: marker count 1,381; blank railway municipality names 3,156; municipality code/prefecture prefix mismatches 0. Railway total 9,046; nonblank municipality names 5,890 (65.1%).

Prior updates: 2,919 + 857, so 5,157 railway municipality names filled across the three batches.

Caveat: Cross-category internal-data consensus, not an authoritative external municipality master validation. Municipality code NULL and full station address enrichment remain separate tasks. Do not fabricate addresses or assign one arbitrary municipality to multi-jurisdiction sites.
