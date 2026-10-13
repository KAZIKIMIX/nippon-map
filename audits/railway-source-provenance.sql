-- Read-only: inspect source metadata completeness for railway stations.
SELECT COALESCE(source_id::text,'unknown') AS source_id,COUNT(*) AS stations,
 COUNT(*) FILTER (WHERE source_record_id IS NULL OR btrim(source_record_id)='') AS missing_source_record_id,
 COUNT(*) FILTER (WHERE data_date IS NULL) AS missing_data_date,
 COUNT(*) FILTER (WHERE verified_at IS NULL) AS never_verified,
 COUNT(*) FILTER (WHERE official_url IS NULL OR btrim(official_url)='') AS missing_official_url
FROM public.places WHERE is_active AND category_id=8
GROUP BY source_id ORDER BY stations DESC;
