-- Run in Supabase SQL Editor (once).
-- Enables per-user cloud state for grind drafts, routines, voyage, alchemy, carrack.

create table if not exists public.user_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

create index if not exists user_state_user_id_idx on public.user_state (user_id);

alter table public.user_state enable row level security;

drop policy if exists "user_state_select_own" on public.user_state;
drop policy if exists "user_state_insert_own" on public.user_state;
drop policy if exists "user_state_update_own" on public.user_state;
drop policy if exists "user_state_delete_own" on public.user_state;

create policy "user_state_select_own"
  on public.user_state for select
  using (auth.uid() = user_id);

create policy "user_state_insert_own"
  on public.user_state for insert
  with check (auth.uid() = user_id);

create policy "user_state_update_own"
  on public.user_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_state_delete_own"
  on public.user_state for delete
  using (auth.uid() = user_id);
