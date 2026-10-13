-- Read-only: identify already-coded railway names that disagree with official N03.
WITH official AS (
 SELECT municipality_code,MIN(municipality_name) AS official_name
 FROM public.municipality_boundaries_staging
 WHERE source_year=(SELECT MAX(source_year) FROM public.municipality_boundaries_staging)
 GROUP BY municipality_code HAVING COUNT(DISTINCT municipality_name)=1
)
SELECT p.id,p.name,p.municipality_code,p.municipality_name,o.official_name
FROM public.places p JOIN official o ON o.municipality_code=p.municipality_code
WHERE p.is_active AND p.category_id=8 AND btrim(COALESCE(p.municipality_name,''))<>''
 AND regexp_replace(p.municipality_name,'^.*郡','')<>regexp_replace(o.official_name,'^.*郡','')
ORDER BY p.id;
