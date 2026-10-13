-- Read-only per-prefecture N03 import coverage and code-name conflicts.
WITH latest AS (
 SELECT * FROM public.municipality_boundaries_staging
 WHERE source_year=(SELECT MAX(source_year) FROM public.municipality_boundaries_staging)
), names AS (
 SELECT municipality_code,COUNT(DISTINCT municipality_name) AS variants
 FROM latest GROUP BY municipality_code
)
SELECT LEFT(l.municipality_code,2) AS prefecture_code,
 COUNT(*) AS polygon_features,
 COUNT(DISTINCT l.municipality_code) AS codes,
 COUNT(*) FILTER (WHERE n.variants>1) AS conflicting_features
FROM latest l JOIN names n USING(municipality_code)
GROUP BY 1 ORDER BY 1;
