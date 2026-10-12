# Duplicate candidate review — 2026-10-12

Scope: 11,059 active facilities, live Supabase. This is a candidate extraction and safe decision-rule specification, **not** a declaration that all same-name stations are unique.

## Candidate extraction
- Category + prefecture + exact name: 56 duplicate-name groups (railway category).
- Category + prefecture + exact name + latitude/longitude rounded to 5 decimals: 0 exact-location duplicate groups.
- Railway station_group_code duplicated across active rows: 0 groups.
- Example: Tokyo Station, Tokyo: ID 8771 at 35.680965,139.766685, group_code 003766, and ID 9542 at 35.6776915596427,139.765237038487, group_code 003785. They have different group codes and locations, so do not merge automatically.

## Safe decision rules
1. Match candidates by category + prefecture + normalized name; name equality alone is insufficient for deletion.
2. Compare source_record_id, operator(s), route(s), station_group_code, and geodesic distance. Distinct station_group_code is a warning against auto-merging, not conclusive evidence of separate physical stations.
3. Only mark an actual duplicate after corroborating the same physical facility using an authoritative station master or operator data and compatible coordinates.
4. If operator/route/platform/complex relationships differ, keep both and flag for manual review.
5. Any merge must preserve a redirect/alias mapping for IDs and deep links, record source evidence, and run a rollback-ready transaction.
6. No rows were deleted or merged in this audit.

## Follow-up
Complete authoritative review of the 56 same-prefecture name groups under the dedicated railway duplicate tasks. Also check cross-prefecture near-boundary and transliteration/spacing variants.
