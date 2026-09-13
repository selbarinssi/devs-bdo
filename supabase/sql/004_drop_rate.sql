-- Drop rate on sessions (run once in Supabase SQL Editor)
alter table public.sessions
  add column if not exists drop_rate double precision;

-- If Create Spot still fails, also re-run 003_shared_spots.sql so spots policies
-- allow authenticated insert (spots_insert_auth).
