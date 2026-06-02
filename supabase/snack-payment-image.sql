alter table snack_sessions
  add column if not exists payment_qr_url text;
