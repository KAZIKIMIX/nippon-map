# Data quality audit — 2026-10-12

Scope: 11,059 active places across 21 categories. Source: live Supabase SQL queries. This report records checks, not proof of full positional or source accuracy.

## Checks performed
- Coordinates: 0 NULL pairs, 0 outside the coarse Japan bounding box (latitude 20–46, longitude 122–154). Bounding-box success does not establish positional accuracy.
- Exact candidate duplicates: 0 groups sharing category, prefecture, name and both coordinates rounded to 5 decimals. Same-name stations with different coordinates remain to be reviewed.
- Names: 1 trailing-space anomaly corrected in place ID 1936 (伊豆ゲートウェイ函南); 1 double-space occurrence in the name San　Pin  中津 retained pending official-spelling verification; 0 control characters.
- Prefecture codes: 30 NULL codes; inspected and found all 30 to be cross-prefecture or broad-area entries, not single-prefecture facilities. Do not assign a single prefecture code without modeling multi-prefecture membership.
- Municipality codes: 0 malformed populated codes, but 1,853 active facilities have a municipality name and no municipality code; these need verified code backfill.
- Municipality names: 8,860 empty (railway 8,810; national parks 35; world heritage 15). The latter two can legitimately span multiple municipalities.
- Facility names, addresses and prefecture names: 0 blank active rows across the 21 categories.
- URL syntax: 0 malformed nonempty HTTP(S) URLs (does not imply that destinations are reachable).

## Follow-ups
1. Resolve station municipalities through official municipal boundary spatial joins.
2. Verify municipality codes against an authoritative municipality code list before backfill.
3. Inspect same-name / nearby coordinates for duplicates, rather than relying on exact coordinate matching.
4. Check external URL reachability and station operator sources separately.
5. Confirm the canonical spelling of San　Pin  中津 before normalizing internal spaces.

## Operational note
Vercel production deployments for commits 39725f5 and feaa5e5 showed ERROR. Attempt to fetch deployment build logs returned HTTP 403 for scope m011320011-6922. No speculative redeployment was attempted.
