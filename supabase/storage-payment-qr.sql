-- Payment QR image storage (run once in Supabase SQL Editor)

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
