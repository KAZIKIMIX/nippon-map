-- Read-only checks to run after importing official N03 staging CSV.
-- Every feature must have a polygon, valid coordinates and source provenance.
SELECT source_year,COUNT(*) AS polygons,COUNT(DISTINCT municipality_code) AS municipalities,
 COUNT(*) FILTER (WHERE NOT ST_IsValid(ST_SetSRID(ST_GeomFromGeoJSON(geometry_geojson::text),4326))) AS invalid_geometries,
 COUNT(*) FILTER (WHERE ST_IsEmpty(ST_SetSRID(ST_GeomFromGeoJSON(geometry_geojson::text),4326))) AS empty_geometries,
 COUNT(*) FILTER (WHERE geometry_geojson->>'type' NOT IN ('Polygon','MultiPolygon')) AS wrong_geometry_types,
 COUNT(*) FILTER (WHERE source_url !~ '^https://') AS missing_source_urls
FROM public.municipality_boundaries_staging GROUP BY source_year ORDER BY source_year DESC;

-- If this returns any rows, halt municipality-name promotion.
SELECT source_year,municipality_code,COUNT(DISTINCT municipality_name) AS name_variants
FROM public.municipality_boundaries_staging
GROUP BY source_year,municipality_code
HAVING COUNT(DISTINCT municipality_name)>1
ORDER BY source_year DESC,municipality_code;

-- Never mix different release years within one point-in-polygon operation.
SELECT source_year,COUNT(DISTINCT source_url) AS distinct_sources
FROM public.municipality_boundaries_staging GROUP BY source_year;
