-- Read-only: prioritize municipality-code gaps by prefecture and station metadata.
SELECT prefecture_code,prefecture_name,COUNT(*) AS missing_code_stations,
 COUNT(*) FILTER (WHERE address IS NOT NULL AND length(btrim(address))>=7) AS usable_address_candidates,
 COUNT(*) FILTER (WHERE municipality_name IS NOT NULL AND btrim(municipality_name)<>'') AS named_city_candidates,
 COUNT(*) FILTER (WHERE latitude BETWEEN 20 AND 46 AND longitude BETWEEN 122 AND 154) AS in_japan_bounding_box
FROM public.places WHERE is_active AND category_id=8 AND municipality_code IS NULL
GROUP BY prefecture_code,prefecture_name ORDER BY missing_code_stations DESC,prefecture_code;
