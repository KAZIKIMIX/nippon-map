# N03 GeoJSON ingestion safety

The N03 converter performs read-only source parsing and writes a CSV for separate staging review.

Required guards:
- Input must be an explicit local GeoJSON FeatureCollection; never execute source text as code.
- Reject malformed polygon coordinate arrays, unclosed rings, non-finite numbers, and coordinates outside longitude ±180 / latitude ±90.
- Reject invalid municipality codes, blank names, and conflicting names for the same code.
- Do not overwrite the input file or mutate production tables.
- Record dataset year, official source URL, and SHA-256 separately.
- Reject unexpected source-year mixing, conflicting geometries, and ambiguous boundary matches.
- Stage under RLS with no anon/authenticated permissions.
- Do not publish derived N03 polygons before reviewing the official redistribution conditions.

These checks do not substitute for a complete PostGIS ST_IsValid inspection after import.
