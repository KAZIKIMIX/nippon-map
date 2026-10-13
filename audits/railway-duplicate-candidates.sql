-- Read-only: same-name stations within 150 metres are REVIEW candidates only.
-- Distinct operators or railway lines may legitimately share a station name.
SELECT a.id AS station_a,b.id AS station_b,a.name,a.prefecture_name,
 ROUND(ST_DistanceSphere(ST_MakePoint(a.longitude,a.latitude),ST_MakePoint(b.longitude,b.latitude))::numeric,1) AS metres,
 a.metadata->'operators' AS operators_a,b.metadata->'operators' AS operators_b,
 a.metadata->'routes' AS routes_a,b.metadata->'routes' AS routes_b
FROM public.places a JOIN public.places b ON a.id<b.id AND a.name=b.name AND a.prefecture_code=b.prefecture_code
WHERE a.is_active AND b.is_active AND a.category_id=8 AND b.category_id=8
 AND ST_DWithin(ST_SetSRID(ST_MakePoint(a.longitude,a.latitude),4326)::geography,
                ST_SetSRID(ST_MakePoint(b.longitude,b.latitude),4326)::geography,150)
ORDER BY metres,a.id,b.id;
