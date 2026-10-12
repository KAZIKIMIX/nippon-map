# Facility name normalization audit — 2026-10-12

Live Supabase, 11,059 active facilities.
- Leading/trailing whitespace: 0 (previously corrected place ID 1936 伊豆ゲートウェイ函南).
- ASCII repeated spaces: 1 (place ID 2081 `San　Pin  中津`), retained pending authoritative name check.
- Control characters: 0.

## Normalization policy
- Preserve the authoritative facility display name, including Japanese spacing and historical typography.
- Normalize NFKC and collapse whitespace for *search keys* only, not persisted official names, unless the facility's official spelling confirms a change.
- Do not silently alter different station names or merge facilities by a normalized search key.
- Status: baseline whitespace audit and normalization policy complete; comprehensive historical/variant spelling validation requires authoritative external sources.
