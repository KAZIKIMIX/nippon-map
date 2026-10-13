-- Read-only: count code-null stations by unique, ambiguous, unmatched N03 polygon.
WITH polygons AS (
 SELECT municipality_code,ST_SetSRID(ST_GeomFromGeoJSON(geometry_geojson::text),4326) AS geom
 FROM public.municipality_boundaries_staging
 WHERE source_year=(SELECT MAX(source_year) FROM public.municipality_boundaries_staging)
), stations AS (
 SELECT id,prefecture_code,ST_SetSRID(ST_MakePoint(longitude,latitude),4326) AS geom
 FROM public.places WHERE is_active AND category_id=8 AND municipality_code IS NULL
), matches AS (
 SELECT s.id,s.prefecture_code,COUNT(DISTINCT b.municipality_code) AS candidate_count,
 MIN(b.municipality_code) AS candidate_code
 FROM stations s LEFT JOIN polygons b ON ST_Covers(b.geom,s.geom)
 GROUP BY s.id,s.prefecture_code
)
SELECT CASE WHEN candidate_count=0 THEN 'unmatched'
 WHEN candidate_count>1 THEN 'ambiguous'
 WHEN LEFT(candidate_code,2)<>prefecture_code THEN 'prefecture_conflict'
 ELSE 'unique_candidate' END AS status,COUNT(*) AS stations
FROM matches GROUP BY 1 ORDER BY 1;
