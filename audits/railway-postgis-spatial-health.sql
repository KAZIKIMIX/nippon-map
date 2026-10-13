-- Read-only: verify all railway station points can be constructed as SRID 4326.
SELECT COUNT(*) AS total_stations,
 COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) AS missing_points,
 COUNT(*) FILTER (WHERE latitude NOT BETWEEN -90 AND 90 OR longitude NOT BETWEEN -180 AND 180) AS invalid_wgs84,
 COUNT(*) FILTER (WHERE latitude NOT BETWEEN 20 AND 46 OR longitude NOT BETWEEN 122 AND 154) AS outside_japan_envelope
FROM public.places WHERE is_active AND category_id=8;
