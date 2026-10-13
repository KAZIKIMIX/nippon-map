-- Read-only: coordinate anomalies to review before spatial joins.
SELECT id,name,prefecture_name,municipality_code,latitude,longitude,
 CASE WHEN latitude IS NULL OR longitude IS NULL THEN 'missing'
 WHEN latitude NOT BETWEEN 20 AND 46 OR longitude NOT BETWEEN 122 AND 154 THEN 'outside_japan_bbox'
 WHEN latitude=0 OR longitude=0 THEN 'zero'
 ELSE 'check' END AS reason
FROM public.places WHERE is_active AND category_id=8
 AND (latitude IS NULL OR longitude IS NULL OR latitude NOT BETWEEN 20 AND 46 OR longitude NOT BETWEEN 122 AND 154 OR latitude=0 OR longitude=0)
ORDER BY id;
