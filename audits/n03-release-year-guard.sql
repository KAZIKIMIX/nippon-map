-- Read-only: reject inconsistent staging release metadata before promotion.
SELECT source_year,COUNT(DISTINCT source_url) AS source_urls,
 COUNT(*) FILTER (WHERE imported_at>now()) AS future_imports,
 COUNT(*) FILTER (WHERE municipality_code !~ '^[0-9]{5}$') AS malformed_codes,
 COUNT(*) FILTER (WHERE source_url !~ '^https://') AS invalid_sources
FROM public.municipality_boundaries_staging
GROUP BY source_year ORDER BY source_year DESC;
