-- Categories are household-scoped (not per-month). Budgets already carry month.
-- Revert ad-hoc month PK that broke client upserts (on_conflict household_id,id).

alter table public.categories drop constraint if exists categories_pkey;

-- Collapse any multi-month duplicates (keep one row per household_id,id)
delete from public.categories c
using public.categories d
where c.household_id = d.household_id
  and c.id = d.id
  and c.ctid < d.ctid;

alter table public.categories drop column if exists month;

alter table public.categories add primary key (household_id, id);

drop index if exists public.categories_household_month_idx;
