-- Read-only nationwide data-quality report. Run in Supabase SQL Editor.
-- Municipality codes and street addresses must never be inferred from station names.
SELECT c.slug AS category, COUNT(*) AS total,
 COUNT(*) FILTER (WHERE p.municipality_code IS NULL OR btrim(p.municipality_code)='') AS missing_municipality_code,
 COUNT(*) FILTER (WHERE p.municipality_name IS NULL OR btrim(p.municipality_name)='') AS missing_municipality_name,
 COUNT(*) FILTER (WHERE p.address IS NULL OR length(btrim(p.address))<7) AS incomplete_address,
 COUNT(*) FILTER (WHERE p.latitude IS NULL OR p.longitude IS NULL OR p.latitude NOT BETWEEN 20 AND 46 OR p.longitude NOT BETWEEN 122 AND 154) AS invalid_or_missing_coordinates,
 COUNT(*) FILTER (WHERE p.municipality_code IS NOT NULL AND LEFT(p.municipality_code,2)<>p.prefecture_code) AS prefecture_code_mismatch
FROM public.places p JOIN public.categories c ON c.id=p.category_id
WHERE p.is_active GROUP BY c.slug ORDER BY total DESC;

-- Rail stations requiring municipality master or geospatial reconciliation.
SELECT p.id,p.name,p.prefecture_name,p.municipality_code,p.latitude,p.longitude,p.address
FROM public.places p WHERE p.is_active AND p.category_id=8
 AND (p.municipality_name IS NULL OR btrim(p.municipality_name)='')
ORDER BY p.prefecture_code,p.id;

-- Known codes with multiple competing names: inspect before canonicalizing.
SELECT municipality_code, COUNT(DISTINCT municipality_name) AS variants,
 string_agg(DISTINCT municipality_name,' / ' ORDER BY municipality_name) AS observed_names
FROM public.places WHERE is_active AND municipality_code IS NOT NULL
 AND municipality_name IS NOT NULL AND btrim(municipality_name)<>''
GROUP BY municipality_code HAVING COUNT(DISTINCT municipality_name)>1
ORDER BY municipality_code;
