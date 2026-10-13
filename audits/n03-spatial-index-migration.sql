-- Optional performance optimization AFTER validated official N03 import.
-- Geometry generated from staging GeoJSON; create a dedicated indexed table.
-- Run only once per approved release, with migration review.
CREATE TABLE IF NOT EXISTS public.municipality_boundaries (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 municipality_code text NOT NULL,
 municipality_name text NOT NULL,
 source_year integer NOT NULL,
 geom geometry(Geometry,4326) NOT NULL
);
ALTER TABLE public.municipality_boundaries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.municipality_boundaries FROM anon,authenticated;
CREATE INDEX IF NOT EXISTS municipality_boundaries_geom_gix ON public.municipality_boundaries USING GIST(geom);
CREATE INDEX IF NOT EXISTS municipality_boundaries_code_idx ON public.municipality_boundaries(municipality_code);
-- Do not promote source records until the staging integrity checks pass.
