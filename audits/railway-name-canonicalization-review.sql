-- Read-only: show codes with distinct station city labels after county-prefix normalization.
SELECT municipality_code,
 COUNT(DISTINCT municipality_name) AS variants,
 COUNT(DISTINCT regexp_replace(municipality_name,'^.*郡','')) AS normalized_variants,
 string_agg(DISTINCT municipality_name,' / ' ORDER BY municipality_name) AS names
FROM public.places WHERE is_active AND category_id=8
 AND municipality_code IS NOT NULL AND btrim(COALESCE(municipality_name,''))<>''
GROUP BY municipality_code HAVING COUNT(DISTINCT municipality_name)>1
ORDER BY normalized_variants DESC,municipality_code;
