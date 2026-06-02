-- Run if Messages shows no teammates (employees could not read other profiles).
-- Replaces profiles select policy so all logged-in users can see name/role for messaging.

drop policy if exists "profiles_select" on public.profiles;

create policy "profiles_select"
  on public.profiles
  for select
  to authenticated
  using (true);
