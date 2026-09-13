-- Shared spots + loots for everyone; sessions stay per-user.

drop policy if exists "spots_select_own" on public.spots;
drop policy if exists "spots_insert_own" on public.spots;
drop policy if exists "spots_update_own" on public.spots;
drop policy if exists "spots_delete_own" on public.spots;

alter table public.spots enable row level security;

create policy "spots_select_auth"
  on public.spots for select to authenticated
  using (true);

create policy "spots_insert_auth"
  on public.spots for insert to authenticated
  with check (true);

create policy "spots_update_auth"
  on public.spots for update to authenticated
  using (true) with check (true);

create policy "spots_delete_auth"
  on public.spots for delete to authenticated
  using (true);

drop policy if exists "loots_select_own" on public.loots;
drop policy if exists "loots_insert_own" on public.loots;
drop policy if exists "loots_update_own" on public.loots;
drop policy if exists "loots_delete_own" on public.loots;

alter table public.loots enable row level security;

create policy "loots_select_auth"
  on public.loots for select to authenticated
  using (true);

create policy "loots_insert_auth"
  on public.loots for insert to authenticated
  with check (true);

create policy "loots_update_auth"
  on public.loots for update to authenticated
  using (true) with check (true);

create policy "loots_delete_auth"
  on public.loots for delete to authenticated
  using (true);

alter table public.sessions
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists sessions_user_id_idx on public.sessions (user_id);

alter table public.sessions enable row level security;

drop policy if exists "sessions_select_own" on public.sessions;
drop policy if exists "sessions_insert_own" on public.sessions;
drop policy if exists "sessions_update_own" on public.sessions;
drop policy if exists "sessions_delete_own" on public.sessions;

create policy "sessions_select_own" on public.sessions for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on public.sessions for insert with check (auth.uid() = user_id);
create policy "sessions_update_own" on public.sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sessions_delete_own" on public.sessions for delete using (auth.uid() = user_id);

alter table public.session_loots enable row level security;

drop policy if exists "session_loots_select_own" on public.session_loots;
drop policy if exists "session_loots_insert_own" on public.session_loots;
drop policy if exists "session_loots_delete_own" on public.session_loots;

create policy "session_loots_select_own" on public.session_loots for select using (
  exists (select 1 from public.sessions se where se.id = session_loots.session_id and se.user_id = auth.uid())
);
create policy "session_loots_insert_own" on public.session_loots for insert with check (
  exists (select 1 from public.sessions se where se.id = session_loots.session_id and se.user_id = auth.uid())
);
create policy "session_loots_delete_own" on public.session_loots for delete using (
  exists (select 1 from public.sessions se where se.id = session_loots.session_id and se.user_id = auth.uid())
);
