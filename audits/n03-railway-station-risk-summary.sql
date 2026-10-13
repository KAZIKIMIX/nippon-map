-- Read-only risk distribution for official spatial code backfill.
WITH polygons AS (
 SELECT municipality_code,ST_SetSRID(ST_GeomFromGeoJSON(geometry_geojson::text),4326) geom
 FROM public.municipality_boundaries_staging
 WHERE source_year=(SELECT MAX(source_year) FROM public.municipality_boundaries_staging)
), stations AS (
 SELECT id,prefecture_code,ST_SetSRID(ST_MakePoint(longitude,latitude),4326) geom
 FROM public.places WHERE is_active AND category_id=8 AND municipality_code IS NULL
), matches AS (
 SELECT s.id,s.prefecture_code,COUNT(DISTINCT b.municipality_code) AS codes,MIN(b.municipality_code) AS code
 FROM stations s LEFT JOIN polygons b ON ST_Covers(b.geom,s.geom)
 GROUP BY s.id,s.prefecture_code
)
SELECT prefecture_code,COUNT(*) AS missing_code_stations,
 COUNT(*) FILTER (WHERE codes=1 AND LEFT(code,2)=prefecture_code) AS unique_matches,
 COUNT(*) FILTER (WHERE codes>1) AS ambiguous,
 COUNT(*) FILTER (WHERE codes=0) AS no_polygon,
 COUNT(*) FILTER (WHERE codes=1 AND LEFT(code,2)<>prefecture_code) AS prefecture_conflict
FROM matches GROUP BY prefecture_code ORDER BY missing_code_stations DESC;
