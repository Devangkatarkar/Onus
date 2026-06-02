-- Run this in Supabase SQL Editor if you see:
-- "new row violates row-level security policy"
-- (usually when uploading payment QR or creating snack orders)

-- ========== Storage: payment QR images ==========
insert into storage.buckets (id, name, public)
values ('payment-qr', 'payment-qr', true)
on conflict (id) do update set public = true;

drop policy if exists "payment_qr_public_read" on storage.objects;
drop policy if exists "payment_qr_auth_upload" on storage.objects;
drop policy if exists "payment_qr_auth_update" on storage.objects;
drop policy if exists "payment_qr_auth_delete" on storage.objects;

create policy "payment_qr_public_read"
  on storage.objects for select
  using (bucket_id = 'payment-qr');

-- Any logged-in user can upload QR images (internal app)
create policy "payment_qr_auth_upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-qr');

create policy "payment_qr_auth_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'payment-qr')
  with check (bucket_id = 'payment-qr');

create policy "payment_qr_auth_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'payment-qr');

-- ========== Snack tables (re-apply if missing) ==========
alter table snack_sessions enable row level security;
alter table snack_orders enable row level security;
alter table snack_payments enable row level security;

drop policy if exists "snack_sessions_select" on snack_sessions;
drop policy if exists "snack_sessions_insert" on snack_sessions;
drop policy if exists "snack_sessions_update_organizer" on snack_sessions;

create policy "snack_sessions_select"
  on snack_sessions for select to authenticated using (true);

create policy "snack_sessions_insert"
  on snack_sessions for insert to authenticated
  with check ((select auth.uid()) = organizer_id);

create policy "snack_sessions_update_organizer"
  on snack_sessions for update to authenticated
  using ((select auth.uid()) = organizer_id)
  with check ((select auth.uid()) = organizer_id);

drop policy if exists "snack_orders_select" on snack_orders;
drop policy if exists "snack_orders_insert" on snack_orders;
drop policy if exists "snack_orders_update" on snack_orders;
drop policy if exists "snack_orders_upsert" on snack_orders;

create policy "snack_orders_select"
  on snack_orders for select to authenticated using (true);

create policy "snack_orders_insert"
  on snack_orders for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "snack_orders_update"
  on snack_orders for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "snack_payments_select" on snack_payments;
drop policy if exists "snack_payments_insert" on snack_payments;

create policy "snack_payments_select"
  on snack_payments for select to authenticated using (true);

create policy "snack_payments_insert"
  on snack_payments for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Columns for QR image URL (safe if already exist)
alter table snack_sessions add column if not exists payment_qr_url text;
alter table event_payments add column if not exists payment_qr_url text;
