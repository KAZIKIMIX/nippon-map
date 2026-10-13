-- Read-only review: coded railway stations outside their assigned N03 municipality.
-- Use the latest official boundary year, but never automatically overwrite
-- historical codes without inspecting railway station coordinates.
WITH boundaries AS (
 SELECT municipality_code,ST_SetSRID(ST_GeomFromGeoJSON(geometry_geojson::text),4326) AS geom
 FROM public.municipality_boundaries_staging
 WHERE source_year=(SELECT MAX(source_year) FROM public.municipality_boundaries_staging)
)
SELECT p.id,p.name,p.prefecture_name,p.municipality_code,
       p.municipality_name,p.latitude,p.longitude,p.address
FROM public.places p
WHERE p.is_active AND p.category_id=8 AND p.municipality_code IS NOT NULL
 AND NOT EXISTS (
  SELECT 1 FROM boundaries b
  WHERE b.municipality_code=p.municipality_code
   AND ST_Covers(b.geom,ST_SetSRID(ST_MakePoint(p.longitude,p.latitude),4326))
 )
ORDER BY p.prefecture_code,p.id;
