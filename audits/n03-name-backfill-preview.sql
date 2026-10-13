-- Read-only preview for already-coded railway stations with blank municipality_name.
-- N03 reference must first pass staging integrity checks.
WITH reference AS (
 SELECT municipality_code,MIN(municipality_name) AS name
 FROM public.municipality_boundaries_staging
 WHERE source_year=(SELECT MAX(source_year FROM public.municipality_boundaries_staging))
 GROUP BY municipality_code HAVING COUNT(DISTINCT municipality_name)=1
)
SELECT p.id,p.name,p.prefecture_name,p.municipality_code,r.name AS proposed_name
FROM public.places p JOIN reference r ON r.municipality_code=p.municipality_code
WHERE p.is_active AND p.category_id=8
 AND btrim(COALESCE(p.municipality_name,''))=''
 AND LEFT(r.municipality_code,2)=p.prefecture_code
ORDER BY p.id;
