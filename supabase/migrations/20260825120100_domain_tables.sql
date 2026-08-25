-- Domain finance/planning tables + household RLS
-- No financial seed data

create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where user_id = auth.uid() and household_id = p_household_id
  );
$$;

revoke all on function public.is_household_member(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Settings / singleton config
-- ---------------------------------------------------------------------------

create table public.household_settings (
  household_id uuid primary key references public.households(id) on delete cascade,
  household_name text not null,
  current_member_id text not null default 'all',
  last_backup_date timestamptz
);

create table public.credit_card_config (
  household_id uuid primary key references public.households(id) on delete cascade,
  account_id text not null default 'tin_dung',
  card_name text not null default '',
  bank text not null default '',
  credit_limit numeric not null default 0,
  statement_day integer not null default 1,
  due_day integer not null default 1,
  annual_fee numeric not null default 0,
  status text not null default 'ACTIVE',
  last4_digits text
);

-- ---------------------------------------------------------------------------
-- Core collections
-- ---------------------------------------------------------------------------

create table public.accounts (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  name text not null,
  type text not null,
  owner_member_id text,
  opening_balance numeric not null default 0,
  is_active boolean not null default true,
  color text not null default '#64748b',
  primary key (household_id, id)
);

create table public.categories (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  name text not null,
  kind text not null,
  icon text not null default 'MoreHorizontal',
  color text not null default '#94a3b8',
  daily_spend boolean not null default false,
  owner_scope text,
  is_active boolean not null default true,
  primary key (household_id, id)
);

create table public.transactions (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  transaction_date date not null,
  transaction_type text not null,
  amount numeric not null,
  currency text not null default 'VND',
  description text not null default '',
  note text,
  category_id text,
  source_account_id text,
  destination_account_id text,
  member_id text not null,
  counterparty_id text,
  event_id text,
  goal_id text,
  fund_id text,
  savings_deposit_id text,
  loan_id text,
  reversal_of_transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (household_id, id)
);

create table public.suggestion_rules (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  keyword text not null,
  match_type text not null,
  suggested_transaction_type text not null,
  suggested_category_id text,
  suggested_source_account_id text,
  suggested_destination_account_id text,
  suggested_member_id text,
  priority integer not null default 100,
  is_active boolean not null default true,
  primary key (household_id, id)
);

create table public.budgets (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  month text not null,
  category_id text not null,
  member_id text,
  budget_type text not null,
  planned_amount numeric not null default 0,
  primary key (household_id, id)
);

create table public.income_plans (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  month text not null,
  source_name text not null,
  member_id text not null,
  expected_amount numeric not null default 0,
  primary key (household_id, id)
);

create table public.credit_card_statements (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  period_start date not null,
  period_end date not null,
  statement_date date not null,
  due_date date not null,
  calculated_amount numeric not null default 0,
  actual_statement_amount numeric,
  paid_amount numeric not null default 0,
  minimum_payment numeric,
  status text not null,
  primary key (household_id, id)
);

create table public.installment_plans (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  title text not null,
  principal numeric not null,
  months integer not null,
  annual_interest_rate numeric not null default 0,
  fee numeric not null default 0,
  monthly_payment numeric not null default 0,
  start_month text not null,
  paid_months integer not null default 0,
  remaining_principal numeric not null default 0,
  status text not null,
  primary key (household_id, id)
);

create table public.savings_deposits (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  provider text not null,
  product_name text not null,
  owner_member_id text,
  opened_at date not null,
  principal numeric not null,
  annual_interest_rate numeric not null default 0,
  term_months integer not null,
  maturity_date date not null,
  expected_interest numeric not null default 0,
  expected_maturity_amount numeric not null default 0,
  auto_renew boolean not null default false,
  status text not null,
  note text,
  primary key (household_id, id)
);

create table public.counterparties (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  name text not null,
  phone text,
  note text,
  primary key (household_id, id)
);

create table public.loans (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  counterparty_id text not null,
  direction text not null,
  principal numeric not null,
  outstanding_principal numeric not null,
  annual_interest_rate numeric,
  expected_due_date date,
  repayment_priority integer,
  status text not null,
  note text,
  created_at timestamptz not null default now(),
  primary key (household_id, id)
);

create table public.funds (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  name text not null,
  target_amount numeric not null default 0,
  current_amount numeric not null default 0,
  due_date date,
  cycle_months integer,
  planned_contribution_per_month numeric not null default 0,
  backing_account_id text not null,
  icon text not null default 'PiggyBank',
  color text not null default '#10b981',
  status text not null,
  primary key (household_id, id)
);

create table public.planned_expenses (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  title text not null,
  category_id text,
  goal_id text,
  event_id text,
  expected_date date not null,
  expected_amount numeric not null default 0,
  priority text not null,
  status text not null,
  note text,
  primary key (household_id, id)
);

create table public.goals (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  title text not null,
  goal_type text not null,
  target_amount numeric not null default 0,
  saved_amount numeric not null default 0,
  target_date date,
  priority text,
  status text not null,
  note text,
  primary key (household_id, id)
);

create table public.events (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  name text not null,
  event_type text not null,
  start_date date not null,
  end_date date,
  budget_amount numeric,
  status text not null,
  note text,
  primary key (household_id, id)
);

create table public.event_items (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  event_id text not null,
  title text not null,
  planned_amount numeric not null default 0,
  actual_amount numeric not null default 0,
  due_date date,
  status text not null,
  primary key (household_id, id)
);

create table public.event_contributions (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  event_id text not null,
  counterparty_id text not null,
  amount numeric not null default 0,
  received_date date not null,
  contribution_type text not null,
  note text,
  primary key (household_id, id)
);

create table public.recurring_transactions (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  title text not null,
  type text not null,
  amount numeric not null,
  frequency text not null,
  day_of_month integer not null,
  next_date date not null,
  category_id text not null,
  account_id text not null,
  member_id text not null,
  is_active boolean not null default true,
  last_confirmed_date date,
  primary key (household_id, id)
);

create table public.audit_logs (
  household_id uuid not null references public.households(id) on delete cascade,
  id text not null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  description text not null default '',
  user_id text not null,
  timestamp timestamptz not null default now(),
  primary key (household_id, id)
);

-- ---------------------------------------------------------------------------
-- RLS for all domain tables
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'household_settings',
    'credit_card_config',
    'accounts',
    'categories',
    'transactions',
    'suggestion_rules',
    'budgets',
    'income_plans',
    'credit_card_statements',
    'installment_plans',
    'savings_deposits',
    'counterparties',
    'loans',
    'funds',
    'planned_expenses',
    'goals',
    'events',
    'event_items',
    'event_contributions',
    'recurring_transactions',
    'audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_household_member(household_id))',
      t || '_select', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_household_member(household_id))',
      t || '_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id))',
      t || '_update', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_household_member(household_id))',
      t || '_delete', t
    );
  end loop;
end $$;
