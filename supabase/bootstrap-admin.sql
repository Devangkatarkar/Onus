-- Step 1: Check your auth user (replace email)
select id, email from auth.users
where email = 'your-email@company.com';

-- Step 2: Create or update admin profile (replace email)
insert into profiles (id, name, role)
select
  id,
  'Admin User',
  'admin'
from auth.users
where lower(email) = lower('your-email@company.com')
on conflict (id) do update
  set name = excluded.name,
      role = 'admin';

-- Step 3: Verify profile exists
select u.email, u.id, p.name, p.role
from auth.users u
left join profiles p on p.id = u.id
where lower(u.email) = lower('your-email@company.com');

-- You should see role = admin. Then refresh the app and sign in again.
