-- Dry-run only: candidates for authoritative municipality polygon assignment.
-- Requires public.municipality_boundaries with municipality_code, municipality_name, geom
-- where geom is a valid SRID 4326 multipolygon sourced from official N03 data.
-- DO NOT run unless the boundary table is imported and validated.
-- Uses ST_Covers to avoid dropping exact boundary points; only one matching
-- polygon is accepted. Multiple matches and no matches remain unresolved.
WITH matches AS (
 SELECT p.id,p.name,p.prefecture_code,p.latitude,p.longitude,
        b.municipality_code,b.municipality_name
 FROM public.places p
 JOIN public.municipality_boundaries b
   ON ST_Covers(b.geom, ST_SetSRID(ST_MakePoint(p.longitude,p.latitude),4326))
 WHERE p.is_active AND p.category_id=8 AND p.municipality_code IS NULL
), grouped AS (
 SELECT id,COUNT(DISTINCT municipality_code) AS matches,
        MIN(municipality_code) AS candidate_code,
        MIN(municipality_name) AS candidate_name
 FROM matches GROUP BY id
)
SELECT p.id,p.name,p.prefecture_name,p.latitude,p.longitude,
       COALESCE(g.matches,0) AS polygon_matches,
       CASE WHEN g.matches=1 AND LEFT(g.candidate_code,2)=p.prefecture_code
            THEN g.candidate_code ELSE NULL END AS proposed_code,
       CASE WHEN g.matches=1 AND LEFT(g.candidate_code,2)=p.prefecture_code
            THEN g.candidate_name ELSE NULL END AS proposed_name
FROM public.places p LEFT JOIN grouped g ON p.id=g.id
WHERE p.is_active AND p.category_id=8 AND p.municipality_code IS NULL
ORDER BY p.id;
