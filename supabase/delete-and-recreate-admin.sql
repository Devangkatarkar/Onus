-- How to replace your admin account
-- Run steps in order in Supabase SQL Editor.

-- STEP 1: Find your current admin (optional)
select u.id, u.email, p.name, p.role
from auth.users u
left join profiles p on p.id = u.id;

-- STEP 2: Delete the old admin PROFILE (replace email)
delete from profiles
where id in (
  select id from auth.users where lower(email) = lower('old-admin@company.com')
);

-- STEP 3: Delete the old admin AUTH user (replace email)
-- If this fails due to foreign keys, delete related rows first or use Dashboard:
-- Authentication → Users → delete user
delete from auth.users
where lower(email) = lower('old-admin@company.com');

-- STEP 4: Create new user in Dashboard → Authentication → Add user
-- Or use Admin → Employees in the app (needs SUPABASE_SERVICE_ROLE_KEY).

-- STEP 5: Make new user admin (replace email)
insert into profiles (id, name, role)
select id, 'New Admin', 'admin'
from auth.users
where lower(email) = lower('new-admin@company.com')
on conflict (id) do update
  set name = excluded.name, role = 'admin';

-- STEP 6: Verify
select u.email, p.name, p.role
from auth.users u
join profiles p on p.id = u.id
where lower(u.email) = lower('new-admin@company.com');
