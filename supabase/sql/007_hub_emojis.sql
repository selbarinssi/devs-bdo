-- Hub emoji pack (shared stickers for feed)

create table if not exists public.hub_emojis (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (name)
);

create index if not exists hub_emojis_name_idx on public.hub_emojis (name);

alter table public.hub_emojis enable row level security;

drop policy if exists "hub_emojis_select" on public.hub_emojis;
drop policy if exists "hub_emojis_insert_staff" on public.hub_emojis;
drop policy if exists "hub_emojis_delete_staff" on public.hub_emojis;

create policy "hub_emojis_select"
  on public.hub_emojis for select to authenticated using (true);

create policy "hub_emojis_insert_staff"
  on public.hub_emojis for insert to authenticated
  with check (public.is_staff());

create policy "hub_emojis_delete_staff"
  on public.hub_emojis for delete to authenticated
  using (public.is_staff());

grant select, insert, delete on public.hub_emojis to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hub-emojis',
  'hub-emojis',
  true,
  512000,
  array['image/png', 'image/webp', 'image/gif', 'image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "hub_emojis_media_read" on storage.objects;
drop policy if exists "hub_emojis_media_insert" on storage.objects;
drop policy if exists "hub_emojis_media_delete" on storage.objects;

create policy "hub_emojis_media_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'hub-emojis');

create policy "hub_emojis_media_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'hub-emojis' and public.is_staff());

create policy "hub_emojis_media_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'hub-emojis' and public.is_staff());
