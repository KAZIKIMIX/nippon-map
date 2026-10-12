# Search index and query performance baseline — 2026-10-12

Inspected live Supabase pg_indexes and executed EXPLAIN (ANALYZE, BUFFERS) for a representative railway category + Tokyo prefecture + active records query (LIMIT 100).

## Existing indexes
- places: primary key (id), category_id btree, prefecture_code btree, source_id btree, location GiST, metadata GIN.
- categories: primary key and unique slug.
- place_submissions: primary key and (status, created_at DESC) btree.

## Measured query
- Representative predicate: is_active=true AND category_id=(railway id) AND prefecture_code='13', LIMIT 100.
- Plan: category slug index lookup + BitmapAnd on places_category_idx and places_prefecture_idx, then Bitmap Heap Scan.
- Execution time: 7.334 ms; planning time 1.587 ms; 51 shared buffer hits reported in execution.
- These are one-off measurements, not a reliable p95 or production-load benchmark.

## Follow-up
- Evaluate composite partial index (category_id,prefecture_code) WHERE is_active=true only after broader EXPLAIN sampling and write overhead assessment.
- Benchmark actual search RPCs and free-text search separately; this simple filter query does not cover them.
- No speculative index changes were applied.
