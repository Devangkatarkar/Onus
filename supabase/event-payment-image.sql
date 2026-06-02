alter table event_payments
  add column if not exists payment_qr_url text;
