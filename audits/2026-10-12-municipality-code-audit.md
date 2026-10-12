# Prefecture and municipality code consistency audit — 2026-10-12

Live Supabase, 11,059 active facilities.
- Missing prefecture codes: 30, inspected as cross-prefecture/broad-area facilities; do not invent a single prefecture code.
- Populated malformed prefecture codes: 0.
- Missing municipality codes: 10,713.
- Populated malformed municipality codes: 0.
- Municipality name present but code missing: 1,853.
- Municipality name missing: 8,860, of which railway 8,810, national park 35, world heritage 15.

## Policy
- Derive codes from an authoritative current municipality code list, never infer from name alone where duplicate names or mergers may exist.
- Store many-to-many administrative coverage for wide-area assets; do not assign a misleading single code.
- Update name and code together only after prefecture and geospatial validation, and record provenance.
- Status: consistency and missingness audit complete; municipality code enrichment remains outstanding.
