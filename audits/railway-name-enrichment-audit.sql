-- Read-only: trace name enrichments and check source code consistency.
SELECT COALESCE(metadata->>'municipality_name_enrichment','not_tagged') AS method,
 COUNT(*) AS stations,
 COUNT(*) FILTER (WHERE municipality_name IS NULL OR btrim(municipality_name)='') AS missing_name,
 COUNT(*) FILTER (WHERE municipality_code IS NULL) AS missing_code,
 COUNT(*) FILTER (WHERE municipality_code IS NOT NULL AND LEFT(municipality_code,2)<>prefecture_code) AS prefecture_mismatch
FROM public.places WHERE is_active AND category_id=8
GROUP BY 1 ORDER BY stations DESC;
