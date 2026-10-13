-- Read-only municipality assignment candidates from validated N03 staging.
-- Requires public.municipality_boundaries_staging (see n03-staging-schema.sql).
-- Only unique municipality matches within the station's prefecture are proposed.
WITH polygons AS (
 SELECT municipality_code,municipality_name,
        ST_SetSRID(ST_GeomFromGeoJSON(geometry_geojson::text),4326) AS geom
 FROM public.municipality_boundaries_staging
 WHERE source_year=(SELECT MAX(source_year) FROM public.municipality_boundaries_staging)
), candidates AS (
 SELECT p.id,p.name,p.prefecture_code,
        b.municipality_code,b.municipality_name
 FROM public.places p JOIN polygons b
   ON ST_Covers(b.geom,ST_SetSRID(ST_MakePoint(p.longitude,p.latitude),4326))
 WHERE p.is_active AND p.category_id=8 AND p.municipality_code IS NULL
), grouped AS (
 SELECT id,COUNT(DISTINCT municipality_code) AS candidate_count,
        MIN(municipality_code) AS municipality_code,
        MIN(municipality_name) AS municipality_name
 FROM candidates GROUP BY id
)
SELECT p.id,p.name,p.prefecture_name,p.latitude,p.longitude,
       COALESCE(g.candidate_count,0) AS candidate_count,
       CASE WHEN g.candidate_count=1 AND LEFT(g.municipality_code,2)=p.prefecture_code
            THEN g.municipality_code END AS proposed_code,
       CASE WHEN g.candidate_count=1 AND LEFT(g.municipality_code,2)=p.prefecture_code
            THEN g.municipality_name END AS proposed_name
FROM public.places p LEFT JOIN grouped g ON g.id=p.id
WHERE p.is_active AND p.category_id=8 AND p.municipality_code IS NULL
ORDER BY p.id;
