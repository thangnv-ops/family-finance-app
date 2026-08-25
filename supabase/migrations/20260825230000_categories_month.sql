-- Add month to categories; backfill; rebuild PK
alter table public.categories add column if not exists month text;

update public.categories set month = '2026-08' where month is null;

alter table public.categories alter column month set not null;

alter table public.categories drop constraint if exists categories_pkey;
alter table public.categories add primary key (household_id, month, id);

create index if not exists categories_household_month_idx
  on public.categories (household_id, month);
