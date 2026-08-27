create schema if not exists extensions;

alter extension citext set schema extensions;

revoke execute on function public.claim_household_membership() from public, anon;
grant execute on function public.claim_household_membership() to authenticated, service_role;

revoke execute on function public.is_household_member(uuid) from public, anon;
grant execute on function public.is_household_member(uuid) to authenticated, service_role;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
    grant execute on function public.rls_auto_enable() to service_role;
  end if;
end;
$$;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

alter policy households_select on public.households
  using (
    id in (
      select household_id
      from public.household_members
      where user_id = (select auth.uid())
    )
  );

alter policy members_select on public.members
  using (
    household_id in (
      select household_id
      from public.household_members
      where user_id = (select auth.uid())
    )
  );

alter policy profiles_select_own on public.profiles
  using (user_id = (select auth.uid()));

alter policy profiles_update_own on public.profiles
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy household_members_select_own on public.household_members
  using (user_id = (select auth.uid()));
