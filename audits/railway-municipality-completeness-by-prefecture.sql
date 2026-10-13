-- Read-only: distribution of remaining municipality-name gaps.
SELECT prefecture_code,prefecture_name,COUNT(*) AS railway_stations,
 COUNT(*) FILTER (WHERE municipality_name IS NULL OR btrim(municipality_name)='') AS missing_names,
 COUNT(*) FILTER (WHERE municipality_code IS NULL) AS missing_codes
FROM public.places WHERE is_active AND category_id=8
GROUP BY prefecture_code,prefecture_name
ORDER BY missing_names DESC,prefecture_code;
