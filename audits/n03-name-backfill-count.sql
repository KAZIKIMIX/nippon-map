-- Read-only: measure how many missing railway municipality names can be
-- resolved by official N03 using an existing municipality code, without
-- inferring code from station names or changing addresses.
WITH official AS (
 SELECT municipality_code,MIN(municipality_name) AS name
 FROM public.municipality_boundaries_staging
 WHERE source_year=(SELECT MAX(source_year) FROM public.municipality_boundaries_staging)
 GROUP BY municipality_code HAVING COUNT(DISTINCT municipality_name)=1
), candidates AS (
 SELECT p.id,p.municipality_code,o.name
 FROM public.places p JOIN official o ON o.municipality_code=p.municipality_code
 WHERE p.is_active AND p.category_id=8
 AND btrim(COALESCE(p.municipality_name,''))=''
 AND LEFT(p.municipality_code,2)=p.prefecture_code
)
SELECT (SELECT COUNT(*) FROM public.places WHERE is_active AND category_id=8 AND btrim(COALESCE(municipality_name,''))='') AS total_missing_names,
 COUNT(*) AS official_reference_candidates
FROM candidates;
