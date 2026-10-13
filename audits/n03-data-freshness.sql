-- Read-only: check source years and import timestamps.
SELECT source_year,MIN(imported_at) AS first_import,
 MAX(imported_at) AS last_import,COUNT(*) AS features,
 COUNT(DISTINCT municipality_code) AS codes,
 COUNT(DISTINCT source_url) AS source_urls
FROM public.municipality_boundaries_staging
GROUP BY source_year ORDER BY source_year DESC;
