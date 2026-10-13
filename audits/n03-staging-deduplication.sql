-- Read-only: repeated geometry, distinct source years and duplicate polygons.
SELECT source_year,municipality_code,md5(geometry_geojson::text) AS geometry_hash,
 COUNT(*) AS copies
FROM public.municipality_boundaries_staging
GROUP BY source_year,municipality_code,md5(geometry_geojson::text)
HAVING COUNT(*)>1
ORDER BY copies DESC,municipality_code;
