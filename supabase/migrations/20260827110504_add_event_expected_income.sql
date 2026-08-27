alter table public.events
  add column expected_income numeric not null default 0
  constraint events_expected_income_nonnegative check (expected_income >= 0);
