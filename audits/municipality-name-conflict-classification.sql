-- Read-only: classify conflicting names for 32 municipality codes (as of 2026-10-13).
-- Some differences are just county prefixes; others may be true errors.
WITH names AS (
 SELECT municipality_code,
 COUNT(DISTINCT municipality_name) AS variants,
 COUNT(DISTINCT regexp_replace(municipality_name,'^.*郡','')) AS normalized_variants,
 string_agg(DISTINCT municipality_name,' / ' ORDER BY municipality_name) AS examples,
 COUNT(*) AS source_rows
 FROM public.places
 WHERE is_active AND municipality_code IS NOT NULL
 AND btrim(COALESCE(municipality_name,''))<>''
 GROUP BY municipality_code
)
SELECT municipality_code,variants,normalized_variants,source_rows,examples,
 CASE WHEN normalized_variants=1 THEN 'county_prefix_only'
 ELSE 'needs_official_reference' END AS review_class
FROM names WHERE variants>1
ORDER BY review_class,source_rows DESC,municipality_code;
