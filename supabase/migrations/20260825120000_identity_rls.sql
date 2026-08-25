-- Identity, whitelist, membership claim (SECURITY DEFINER)

create extension if not exists "pgcrypto";
create extension if not exists citext;

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.members (
  id text not null,
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  avatar_color text not null,
  role text not null check (role in ('OWNER', 'MEMBER')),
  is_active boolean not null default true,
  primary key (household_id, id)
);

create table public.allowed_emails (
  email citext primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  member_key text not null,
  unique (household_id, member_key)
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table public.household_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  member_key text not null,
  created_at timestamptz not null default now(),
  unique (household_id, member_key)
);

-- Seed: one household + two directory members + whitelist
insert into public.households (id, name)
values ('11111111-1111-1111-1111-111111111111', 'Gia đình Thắng & Vân');

insert into public.members (id, household_id, name, avatar_color, role, is_active) values
  ('thang', '11111111-1111-1111-1111-111111111111', 'Thắng', '#3b82f6', 'OWNER', true),
  ('van',   '11111111-1111-1111-1111-111111111111', 'Vân',   '#ec4899', 'MEMBER', true);

insert into public.allowed_emails (email, household_id, member_key) values
  ('thanghong195@gmail.com', '11111111-1111-1111-1111-111111111111', 'thang'),
  ('nthvan03@gmail.com',   '11111111-1111-1111-1111-111111111111', 'van');

create or replace function public.claim_household_membership()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_row public.allowed_emails%rowtype;
  v_existing public.household_members%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('status', 'forbidden');
  end if;

  select email into v_email from auth.users where id = v_uid;
  if v_email is null then
    return jsonb_build_object('status', 'forbidden');
  end if;

  select * into v_existing from public.household_members where user_id = v_uid;
  if found then
    insert into public.profiles (user_id, display_name, updated_at)
    values (v_uid, split_part(v_email, '@', 1), now())
    on conflict (user_id) do update set updated_at = now();
    return jsonb_build_object(
      'status', 'ok',
      'household_id', v_existing.household_id,
      'member_key', v_existing.member_key
    );
  end if;

  select * into v_row from public.allowed_emails where email = lower(v_email);
  if not found then
    return jsonb_build_object('status', 'forbidden');
  end if;

  insert into public.household_members (user_id, household_id, member_key)
  values (v_uid, v_row.household_id, v_row.member_key);

  insert into public.profiles (user_id, display_name, updated_at)
  values (v_uid, split_part(v_email, '@', 1), now())
  on conflict (user_id) do update set updated_at = now();

  return jsonb_build_object(
    'status', 'ok',
    'household_id', v_row.household_id,
    'member_key', v_row.member_key
  );
end;
$$;

revoke all on function public.claim_household_membership() from public;
grant execute on function public.claim_household_membership() to authenticated;

alter table public.households enable row level security;
alter table public.members enable row level security;
alter table public.allowed_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.household_members enable row level security;

-- No client access to allowed_emails
revoke all on table public.allowed_emails from anon, authenticated;

create policy households_select on public.households
  for select to authenticated
  using (id in (select household_id from public.household_members where user_id = auth.uid()));

create policy members_select on public.members
  for select to authenticated
  using (household_id in (select household_id from public.household_members where user_id = auth.uid()));

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (user_id = auth.uid());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = auth.uid());

create policy household_members_select_own on public.household_members
  for select to authenticated
  using (user_id = auth.uid());

-- Clients must NOT insert/update/delete household_members (claim RPC only)
