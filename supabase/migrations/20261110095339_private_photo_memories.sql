-- Cloud memories are separate from the public places catalog.
create table public.cloud_photo_memories (
  account_id uuid not null references auth.users(id) on delete restrict,
  id uuid not null,
  prefecture text not null check (char_length(prefecture) between 1 and 8),
  place text not null check (char_length(place) between 1 and 120),
  taken_on date not null,
  ready boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (account_id, id)
);

create table public.photo_memory_entitlements (
  account_id uuid primary key references auth.users(id) on delete cascade,
  unlimited_until timestamptz not null
);

alter table public.cloud_photo_memories enable row level security;
alter table public.photo_memory_entitlements enable row level security;

revoke all on public.cloud_photo_memories, public.photo_memory_entitlements
  from public, anon, authenticated;
grant select on public.cloud_photo_memories to authenticated;
grant select, update, delete on public.cloud_photo_memories to service_role;
grant select, insert, update, delete on public.photo_memory_entitlements to service_role;

create policy "Owners can read ready memories"
  on public.cloud_photo_memories for select to authenticated
  using (account_id = (select auth.uid()) and ready);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photo-memories', 'photo-memories', false, 4194304, array['image/jpeg']);

create policy "Owners can read ready memory photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'photo-memories'
    and exists (
      select 1 from public.cloud_photo_memories as memory
      where memory.account_id = (select auth.uid())
        and memory.ready
        and name = memory.account_id::text || '/' || memory.id::text || '.jpg'
    )
  );

-- The server verifies the session and validates input before calling this function.
-- Count pending uploads too, so simultaneous requests cannot exceed the limit.
create function public.reserve_cloud_photo_memory(
  p_account_id uuid, p_id uuid, p_prefecture text, p_place text, p_taken_on date
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_account_id::text, 912374)
  );

  if exists (
    select 1 from public.cloud_photo_memories
    where account_id = p_account_id and id = p_id
      and prefecture = p_prefecture and place = p_place and taken_on = p_taken_on
  ) then
    return true;
  end if;

  if not exists (
    select 1 from public.photo_memory_entitlements
    where account_id = p_account_id and unlimited_until > pg_catalog.statement_timestamp()
  ) and (
    select count(*) from public.cloud_photo_memories where account_id = p_account_id
  ) >= 3 then
    return false;
  end if;

  insert into public.cloud_photo_memories (account_id, id, prefecture, place, taken_on)
    values (p_account_id, p_id, p_prefecture, p_place, p_taken_on);
  return true;
end;
$$;

revoke all on function public.reserve_cloud_photo_memory(uuid, uuid, text, text, date)
  from public, anon, authenticated;
grant execute on function public.reserve_cloud_photo_memory(uuid, uuid, text, text, date)
  to service_role;
