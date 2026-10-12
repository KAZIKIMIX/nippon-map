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

## Nationwide NFKC and whitespace variant scan
- Names changed by Unicode NFKC normalization: 144 / 11,059.
- Names containing full-width ASCII: 75.
- Names with repeated whitespace: 1.
- Same category + prefecture + NFKC/whitespace-insensitive search key: 56 groups / 112 records; do **not** merge, since same-name railway stations can be distinct.
- Representative display-name variants: 名古屋空港（小牧空港）, ルート２２９元和台, スタープラザ　芦別. These are not automatically errors.
- Old character and variant forms are not automatically replaced: official display spelling must remain intact; the matching/search layer may use normalized aliases.

**Decision:** Task 063 nationwide *detection and handling policy* is complete. Official-name verification and any actual rename are separate category-by-category provenance work. No display names were overwritten.
