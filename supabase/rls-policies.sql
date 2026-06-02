-- Run this ENTIRE file in Supabase SQL Editor (one run).
-- Fixes: "infinite recursion detected in policy for relation profiles"

-- ---------------------------------------------------------------------------
-- 1. Remove ALL existing policies on these tables (including old broken ones)
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'office_settings', 'attendance')
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      r.policyname,
      r.tablename
    );
  end loop;
end $$;

alter table profiles enable row level security;
alter table office_settings enable row level security;
alter table attendance enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Helper: check admin without RLS recursion (security definer)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

-- ---------------------------------------------------------------------------
-- 3. Profiles — team directory + own profile (required for direct messages)
-- ---------------------------------------------------------------------------
create policy "profiles_select"
  on public.profiles
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 4. Office settings
-- ---------------------------------------------------------------------------
create policy "office_settings_select"
  on public.office_settings
  for select
  to authenticated
  using (true);

create policy "office_settings_admin_all"
  on public.office_settings
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- 5. Attendance
-- ---------------------------------------------------------------------------
create policy "attendance_select_own"
  on public.attendance
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "attendance_insert_own"
  on public.attendance
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "attendance_select_admin"
  on public.attendance
  for select
  to authenticated
  using ((select public.is_admin()));
