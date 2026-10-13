-- Read-only post-batch acceptance checks. Record these metrics before and after changes.
SELECT COUNT(*) AS total_railway,
 COUNT(*) FILTER (WHERE municipality_code IS NULL) AS missing_code,
 COUNT(*) FILTER (WHERE municipality_name IS NULL OR btrim(municipality_name)='') AS missing_name,
 COUNT(*) FILTER (WHERE address IS NULL OR length(btrim(address))<7) AS incomplete_address,
 COUNT(*) FILTER (WHERE municipality_code IS NOT NULL AND LEFT(municipality_code,2)<>prefecture_code) AS bad_code_prefix,
 COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL OR latitude NOT BETWEEN 20 AND 46 OR longitude NOT BETWEEN 122 AND 154) AS bad_coordinates
FROM public.places WHERE is_active AND category_id=8;
