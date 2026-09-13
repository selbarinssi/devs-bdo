-- Per-user grind data (run once in Supabase SQL Editor)

alter table public.spots
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.sessions
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists spots_user_id_idx on public.spots (user_id);
create index if not exists sessions_user_id_idx on public.sessions (user_id);

alter table public.spots enable row level security;
alter table public.sessions enable row level security;
alter table public.loots enable row level security;
alter table public.session_loots enable row level security;

drop policy if exists "spots_select_own" on public.spots;
drop policy if exists "spots_insert_own" on public.spots;
drop policy if exists "spots_update_own" on public.spots;
drop policy if exists "spots_delete_own" on public.spots;

create policy "spots_select_own" on public.spots for select using (auth.uid() = user_id);
create policy "spots_insert_own" on public.spots for insert with check (auth.uid() = user_id);
create policy "spots_update_own" on public.spots for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "spots_delete_own" on public.spots for delete using (auth.uid() = user_id);

drop policy if exists "sessions_select_own" on public.sessions;
drop policy if exists "sessions_insert_own" on public.sessions;
drop policy if exists "sessions_update_own" on public.sessions;
drop policy if exists "sessions_delete_own" on public.sessions;

create policy "sessions_select_own" on public.sessions for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on public.sessions for insert with check (auth.uid() = user_id);
create policy "sessions_update_own" on public.sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sessions_delete_own" on public.sessions for delete using (auth.uid() = user_id);

drop policy if exists "loots_select_own" on public.loots;
drop policy if exists "loots_insert_own" on public.loots;
drop policy if exists "loots_update_own" on public.loots;
drop policy if exists "loots_delete_own" on public.loots;

create policy "loots_select_own" on public.loots for select using (
  exists (select 1 from public.spots s where s.id = loots.spot_id and s.user_id = auth.uid())
);
create policy "loots_insert_own" on public.loots for insert with check (
  exists (select 1 from public.spots s where s.id = loots.spot_id and s.user_id = auth.uid())
);
create policy "loots_update_own" on public.loots for update using (
  exists (select 1 from public.spots s where s.id = loots.spot_id and s.user_id = auth.uid())
);
create policy "loots_delete_own" on public.loots for delete using (
  exists (select 1 from public.spots s where s.id = loots.spot_id and s.user_id = auth.uid())
);

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
