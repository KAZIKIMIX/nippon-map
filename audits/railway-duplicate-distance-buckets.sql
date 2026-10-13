-- Read-only: same-name stations by geographic proximity.
WITH pairs AS (
 SELECT a.id a_id,b.id b_id,a.name,a.prefecture_name,
 ST_DistanceSphere(ST_MakePoint(a.longitude,a.latitude),ST_MakePoint(b.longitude,b.latitude)) AS metres
 FROM public.places a JOIN public.places b
 ON a.id<b.id AND a.name=b.name AND a.prefecture_code=b.prefecture_code
 WHERE a.is_active AND b.is_active AND a.category_id=8 AND b.category_id=8
)
SELECT CASE WHEN metres<10 THEN 'under_10m'
 WHEN metres<50 THEN '10_to_50m'
 WHEN metres<150 THEN '50_to_150m'
 WHEN metres<1000 THEN '150m_to_1km'
 ELSE 'over_1km' END AS distance_bucket,COUNT(*) AS station_pairs
FROM pairs GROUP BY 1 ORDER BY 1;
