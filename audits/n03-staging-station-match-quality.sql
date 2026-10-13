-- Read-only: assess station coverage of the latest official N03 polygons.
WITH b AS (
 SELECT municipality_code,ST_SetSRID(ST_GeomFromGeoJSON(geometry_geojson::text),4326) AS geom
 FROM public.municipality_boundaries_staging
 WHERE source_year=(SELECT MAX(source_year) FROM public.municipality_boundaries_staging)
), m AS (
 SELECT p.id,p.prefecture_code,p.municipality_code,
 COUNT(DISTINCT b.municipality_code) AS hits,
 COUNT(DISTINCT b.municipality_code) FILTER (WHERE b.municipality_code=p.municipality_code) AS correct_hits
 FROM public.places p LEFT JOIN b ON ST_Covers(b.geom,ST_SetSRID(ST_MakePoint(p.longitude,p.latitude),4326))
 WHERE p.is_active AND p.category_id=8
 GROUP BY p.id,p.prefecture_code,p.municipality_code
)
SELECT COUNT(*) AS stations,
 COUNT(*) FILTER (WHERE hits=0) AS outside_polygons,
 COUNT(*) FILTER (WHERE hits>1) AS boundary_ambiguity,
 COUNT(*) FILTER (WHERE municipality_code IS NOT NULL AND correct_hits=0) AS existing_code_spatial_mismatch,
 COUNT(*) FILTER (WHERE hits=1) AS unique_polygon_match
FROM m;
