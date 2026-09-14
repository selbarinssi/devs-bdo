-- Roles + Hub Feed (members-only social)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'member'
    check (role in ('member', 'moderator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_auth" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_select_auth"
  on public.profiles for select to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

create policy "profiles_update_admin"
  on public.profiles for update to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('moderator', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

drop policy if exists "spots_insert_auth" on public.spots;
drop policy if exists "spots_update_auth" on public.spots;
drop policy if exists "spots_delete_auth" on public.spots;
drop policy if exists "spots_insert_staff" on public.spots;
drop policy if exists "spots_update_staff" on public.spots;
drop policy if exists "spots_delete_staff" on public.spots;

create policy "spots_insert_staff"
  on public.spots for insert to authenticated
  with check (public.is_staff());

create policy "spots_update_staff"
  on public.spots for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "spots_delete_staff"
  on public.spots for delete to authenticated
  using (public.is_staff());

drop policy if exists "loots_insert_auth" on public.loots;
drop policy if exists "loots_update_auth" on public.loots;
drop policy if exists "loots_delete_auth" on public.loots;
drop policy if exists "loots_insert_staff" on public.loots;
drop policy if exists "loots_update_staff" on public.loots;
drop policy if exists "loots_delete_staff" on public.loots;

create policy "loots_insert_staff"
  on public.loots for insert to authenticated
  with check (public.is_staff());

create policy "loots_update_staff"
  on public.loots for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "loots_delete_staff"
  on public.loots for delete to authenticated
  using (public.is_staff());

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists feed_posts_created_idx on public.feed_posts (created_at desc);

create table if not exists public.feed_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  url text not null,
  sort int not null default 0
);

create index if not exists feed_images_post_idx on public.feed_images (post_id);

create table if not exists public.feed_reactions (
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null,
  primary key (post_id, user_id, emoji)
);

alter table public.feed_posts enable row level security;
alter table public.feed_images enable row level security;
alter table public.feed_reactions enable row level security;

drop policy if exists "feed_posts_select" on public.feed_posts;
drop policy if exists "feed_posts_insert" on public.feed_posts;
drop policy if exists "feed_posts_update" on public.feed_posts;
drop policy if exists "feed_posts_delete" on public.feed_posts;

create policy "feed_posts_select" on public.feed_posts for select to authenticated using (true);
create policy "feed_posts_insert" on public.feed_posts for insert to authenticated with check (auth.uid() = user_id);
create policy "feed_posts_update" on public.feed_posts for update to authenticated
  using (auth.uid() = user_id or public.is_staff())
  with check (auth.uid() = user_id or public.is_staff());
create policy "feed_posts_delete" on public.feed_posts for delete to authenticated
  using (auth.uid() = user_id or public.is_staff());

drop policy if exists "feed_images_select" on public.feed_images;
drop policy if exists "feed_images_insert" on public.feed_images;
drop policy if exists "feed_images_delete" on public.feed_images;

create policy "feed_images_select" on public.feed_images for select to authenticated using (true);
create policy "feed_images_insert" on public.feed_images for insert to authenticated
  with check (
    exists (select 1 from public.feed_posts p where p.id = post_id and p.user_id = auth.uid())
  );
create policy "feed_images_delete" on public.feed_images for delete to authenticated
  using (
    exists (
      select 1 from public.feed_posts p
      where p.id = post_id and (p.user_id = auth.uid() or public.is_staff())
    )
  );

drop policy if exists "feed_reactions_select" on public.feed_reactions;
drop policy if exists "feed_reactions_insert" on public.feed_reactions;
drop policy if exists "feed_reactions_delete" on public.feed_reactions;

create policy "feed_reactions_select" on public.feed_reactions for select to authenticated using (true);
create policy "feed_reactions_insert" on public.feed_reactions for insert to authenticated
  with check (auth.uid() = user_id);
create policy "feed_reactions_delete" on public.feed_reactions for delete to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feed-media',
  'feed-media',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "feed_media_read" on storage.objects;
drop policy if exists "feed_media_insert" on storage.objects;
drop policy if exists "feed_media_delete" on storage.objects;

create policy "feed_media_read"
  on storage.objects for select to authenticated
  using (bucket_id = 'feed-media');

create policy "feed_media_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'feed-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "feed_media_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'feed-media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_staff()
    )
  );
