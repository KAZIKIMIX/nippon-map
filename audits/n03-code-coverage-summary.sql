-- Read-only: compare N03 municipality-code reference to station codes.
WITH reference AS (
 SELECT DISTINCT municipality_code FROM public.municipality_boundaries_staging
 WHERE source_year=(SELECT MAX(source_year) FROM public.municipality_boundaries_staging)
)
SELECT COUNT(*) AS coded_stations,
 COUNT(*) FILTER (WHERE r.municipality_code IS NULL) AS codes_not_in_n03
FROM public.places p LEFT JOIN reference r ON p.municipality_code=r.municipality_code
WHERE p.is_active AND p.category_id=8 AND p.municipality_code IS NOT NULL;
