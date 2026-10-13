-- Apply only after obtaining an official N03 GeoJSON release.
-- Staging is intentionally separate from production public.places.
CREATE TABLE IF NOT EXISTS public.municipality_boundaries_staging (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 municipality_code text NOT NULL CHECK (municipality_code ~ '^[0-9]{5}$'),
 municipality_name text NOT NULL CHECK (length(btrim(municipality_name)) > 0),
 geometry_geojson jsonb NOT NULL,
 source_year integer NOT NULL,
 source_url text NOT NULL,
 imported_at timestamptz NOT NULL DEFAULT now()
);
-- Do not expose staging data through the public API.
ALTER TABLE public.municipality_boundaries_staging ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.municipality_boundaries_staging FROM anon, authenticated;
-- Validate polygon geometry before promoting data to an indexed spatial table.
SELECT municipality_code, municipality_name,
 ST_IsValid(ST_SetSRID(ST_GeomFromGeoJSON(geometry_geojson::text),4326)) AS valid_polygon,
 ST_GeometryType(ST_SetSRID(ST_GeomFromGeoJSON(geometry_geojson::text),4326)) AS geometry_type
FROM public.municipality_boundaries_staging;
