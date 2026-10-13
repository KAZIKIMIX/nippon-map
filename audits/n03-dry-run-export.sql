-- Read-only: deterministic review export for railway city names.
WITH official AS (
 SELECT municipality_code,MIN(municipality_name) AS official_name
 FROM public.municipality_boundaries_staging
 WHERE source_year=(SELECT MAX(source_year) FROM public.municipality_boundaries_staging)
 GROUP BY municipality_code HAVING COUNT(DISTINCT municipality_name)=1
)
SELECT p.id,p.name,p.prefecture_code,p.municipality_code,
 p.municipality_name AS old_name,o.official_name AS proposed_name,
 p.updated_at AS original_updated_at
FROM public.places p JOIN official o ON p.municipality_code=o.municipality_code
WHERE p.is_active AND p.category_id=8
 AND btrim(COALESCE(p.municipality_name,''))=''
 AND LEFT(p.municipality_code,2)=p.prefecture_code
ORDER BY p.id;
