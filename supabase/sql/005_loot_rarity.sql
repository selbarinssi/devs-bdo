-- Loot rarity for display tags + sort order (common → legendary)
alter table public.loots
  add column if not exists rarity text default 'common';

alter table public.loots
  drop constraint if exists loots_rarity_check;

alter table public.loots
  add constraint loots_rarity_check
  check (rarity is null or rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary'));

update public.loots set rarity = 'common' where rarity is null;
