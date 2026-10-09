create table public.map_usage_events (
 id uuid primary key default gen_random_uuid(),
 event_day date not null default (now() at time zone 'Asia/Tokyo')::date,
 event_name text not null check (event_name in ('page_view','category_select','place_open','share_copy')),
 category_slug text check (category_slug is null or category_slug in ('aquarium','zoo','roadside-station','airport','shelter','world-heritage','national-park','railway','museum','park','toilet','castle','lighthouse','hot-spring')),
 source text not null check (source in ('direct','x','instagram','search','other')),
 check (event_name not in ('category_select','place_open') or category_slug is not null)
);
create index map_usage_events_day_idx on public.map_usage_events(event_day);
alter table public.map_usage_events enable row level security;
revoke all on public.map_usage_events from public, anon, authenticated;
grant insert (event_name, category_slug, source) on public.map_usage_events to anon;
create policy map_usage_events_insert on public.map_usage_events for insert to anon
 with check (event_day = (now() at time zone 'Asia/Tokyo')::date);
comment on table public.map_usage_events is 'Anonymous operation counts. No visitor/session identifier, IP, URL, search term, place ID or coordinates. Readable only by database administrators.';
