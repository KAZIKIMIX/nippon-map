-- Validate spatial coverage after import; identify prefectures with no N03 codes.
WITH latest AS (
 SELECT municipality_code FROM public.municipality_boundaries_staging
 WHERE source_year=(SELECT MAX(source_year) FROM public.municipality_boundaries_staging)
), expected AS (
 SELECT DISTINCT prefecture_code,prefecture_name FROM public.places WHERE is_active
)
SELECT e.prefecture_code,e.prefecture_name,
 COUNT(DISTINCT l.municipality_code) AS imported_municipality_codes
FROM expected e LEFT JOIN latest l ON LEFT(l.municipality_code,2)=e.prefecture_code
GROUP BY e.prefecture_code,e.prefecture_name ORDER BY e.prefecture_code;
