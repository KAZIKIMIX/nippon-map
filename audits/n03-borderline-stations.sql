-- Requires populated municipality_boundaries_staging. Review points near borders.
-- Distances use geography metres, not longitude/latitude degrees.
WITH polygons AS (
 SELECT municipality_code,ST_SetSRID(ST_GeomFromGeoJSON(geometry_geojson::text),4326) AS geom
 FROM public.municipality_boundaries_staging
 WHERE source_year=(SELECT MAX(source_year) FROM public.municipality_boundaries_staging)
), points AS (
 SELECT p.id,p.name,p.municipality_code,p.prefecture_name,
 ST_SetSRID(ST_MakePoint(p.longitude,p.latitude),4326) AS geom
 FROM public.places p WHERE p.is_active AND p.category_id=8
)
SELECT p.id,p.name,p.municipality_code,p.prefecture_name,
 MIN(ST_Distance(p.geom::geography,ST_Boundary(b.geom)::geography))::integer AS nearest_boundary_metres
FROM points p JOIN polygons b ON ST_DWithin(p.geom::geography,ST_Boundary(b.geom)::geography,100)
GROUP BY p.id,p.name,p.municipality_code,p.prefecture_name
ORDER BY nearest_boundary_metres,p.id;
