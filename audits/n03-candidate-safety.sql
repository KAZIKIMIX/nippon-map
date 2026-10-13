-- Read-only: exclude candidate codes whose station point matches >1 municipality.
WITH boundaries AS (
 SELECT municipality_code,ST_SetSRID(ST_GeomFromGeoJSON(geometry_geojson::text),4326) AS geom
 FROM public.municipality_boundaries_staging
 WHERE source_year=(SELECT MAX(source_year) FROM public.municipality_boundaries_staging)
), station_matches AS (
 SELECT p.id,p.name,p.prefecture_code,
 COUNT(DISTINCT b.municipality_code) AS candidate_count,
 MIN(b.municipality_code) AS proposed_code
 FROM public.places p LEFT JOIN boundaries b
 ON ST_Covers(b.geom,ST_SetSRID(ST_MakePoint(p.longitude,p.latitude),4326))
 WHERE p.is_active AND p.category_id=8 AND p.municipality_code IS NULL
 GROUP BY p.id,p.name,p.prefecture_code
)
SELECT * FROM station_matches
WHERE candidate_count<>1 OR LEFT(proposed_code,2) IS DISTINCT FROM prefecture_code
ORDER BY candidate_count DESC,id;
