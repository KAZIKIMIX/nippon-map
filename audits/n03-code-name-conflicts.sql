-- Compare known municipality codes to the latest imported N03 reference.
-- Do not auto-overwrite: abbreviated county names and designated-city codes differ.
WITH official AS (
 SELECT municipality_code,MIN(municipality_name) AS official_name
 FROM public.municipality_boundaries_staging
 WHERE source_year=(SELECT MAX(source_year) FROM public.municipality_boundaries_staging)
 GROUP BY municipality_code
 HAVING COUNT(DISTINCT municipality_name)=1
)
SELECT p.municipality_code,p.municipality_name,o.official_name,COUNT(*) AS stations
FROM public.places p JOIN official o USING(municipality_code)
WHERE p.is_active AND p.category_id=8
 AND p.municipality_name IS NOT NULL AND btrim(p.municipality_name)<>''
 AND regexp_replace(p.municipality_name,'^.*郡','')<>regexp_replace(o.official_name,'^.*郡','')
GROUP BY p.municipality_code,p.municipality_name,o.official_name
ORDER BY stations DESC,p.municipality_code;
