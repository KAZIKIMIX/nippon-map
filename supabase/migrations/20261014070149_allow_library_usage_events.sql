BEGIN;
ALTER TABLE public.map_usage_events DROP CONSTRAINT map_usage_events_category_slug_check;
ALTER TABLE public.map_usage_events ADD CONSTRAINT map_usage_events_category_slug_check CHECK (category_slug IS NULL OR category_slug = ANY (ARRAY['aquarium'::text,'library'::text,'zoo'::text,'roadside-station'::text,'airport'::text,'shelter'::text,'world-heritage'::text,'national-park'::text,'railway'::text,'museum'::text,'park'::text,'toilet'::text,'castle'::text,'lighthouse'::text,'hot-spring'::text,'botanical-garden'::text,'campsite'::text,'observation-deck'::text,'theme-park'::text,'factory-tour'::text,'horse-racing'::text,'velodrome'::text,'sightseeing'::text]));
COMMIT;
