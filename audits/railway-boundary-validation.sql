-- Validate official N03 boundary imports before any data mutation.
-- Expected table: public.municipality_boundaries(municipality_code text,
-- municipality_name text, geom geometry(MultiPolygon,4326)).
-- Read-only validation; halt updates if any checks return nonzero.
SELECT COUNT(*) AS rows,
 COUNT(*) FILTER (WHERE municipality_code IS NULL OR municipality_code !~ '^[0-9]{5}$') AS invalid_codes,
 COUNT(*) FILTER (WHERE municipality_name IS NULL OR btrim(municipality_name)='') AS blank_names,
 COUNT(*) FILTER (WHERE geom IS NULL OR ST_IsEmpty(geom)) AS missing_geometries,
 COUNT(*) FILTER (WHERE geom IS NOT NULL AND NOT ST_IsValid(geom)) AS invalid_geometries,
 COUNT(*) FILTER (WHERE geom IS NOT NULL AND ST_SRID(geom)<>4326) AS wrong_srid
FROM public.municipality_boundaries;

-- Municipality code may legitimately have multiple disjoint polygon features;
-- names for a given code should still be consistent.
SELECT municipality_code,COUNT(DISTINCT municipality_name) AS name_variants
FROM public.municipality_boundaries
GROUP BY municipality_code HAVING COUNT(DISTINCT municipality_name)>1;

-- Compare already-coded stations to authoritative polygons; this flags
-- potential stale codes, boundary errors, and mislocated coordinates.
SELECT p.id,p.name,p.municipality_code,p.prefecture_name,p.latitude,p.longitude
FROM public.places p
WHERE p.is_active AND p.category_id=8 AND p.municipality_code IS NOT NULL
 AND NOT EXISTS (
 SELECT 1 FROM public.municipality_boundaries b
 WHERE b.municipality_code=p.municipality_code
 AND ST_Covers(b.geom,ST_SetSRID(ST_MakePoint(p.longitude,p.latitude),4326))
 ) ORDER BY p.id;
