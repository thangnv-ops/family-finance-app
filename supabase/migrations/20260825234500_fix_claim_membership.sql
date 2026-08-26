-- Fix claim: check existing membership before email lookup, and fall back to JWT email.
-- Previously email-null short-circuited to forbidden even when household_members already existed.

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

  select * into v_existing from public.household_members where user_id = v_uid;
  if found then
    return jsonb_build_object(
      'status', 'ok',
      'household_id', v_existing.household_id,
      'member_key', v_existing.member_key
    );
  end if;

  v_email := lower(trim(coalesce(
    (select email::text from auth.users where id = v_uid),
    auth.jwt() ->> 'email',
    ''
  )));

  if v_email = '' then
    return jsonb_build_object('status', 'forbidden');
  end if;

  select * into v_row from public.allowed_emails where email = v_email;
  if not found then
    return jsonb_build_object('status', 'forbidden');
  end if;

  insert into public.household_members (user_id, household_id, member_key)
  values (v_uid, v_row.household_id, v_row.member_key)
  on conflict (user_id) do update
    set household_id = excluded.household_id,
        member_key = excluded.member_key
  returning * into v_existing;

  insert into public.profiles (user_id, display_name, updated_at)
  values (v_uid, split_part(v_email, '@', 1), now())
  on conflict (user_id) do update set updated_at = now();

  return jsonb_build_object(
    'status', 'ok',
    'household_id', v_existing.household_id,
    'member_key', v_existing.member_key
  );
end;
$$;

revoke all on function public.claim_household_membership() from public;
grant execute on function public.claim_household_membership() to authenticated;
