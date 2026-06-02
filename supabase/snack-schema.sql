-- Snack time: orders + organizer QR + paid confirmations

create table if not exists snack_sessions (
  id bigint generated always as identity primary key,
  title text not null,
  organizer_id uuid not null references profiles(id),
  payment_link text,
  amount_per_person numeric(10, 2),
  payment_note text,
  is_open boolean default true,
  created_at timestamptz default now()
);

create table if not exists snack_orders (
  id bigint generated always as identity primary key,
  session_id bigint not null references snack_sessions(id) on delete cascade,
  user_id uuid not null references profiles(id),
  order_text text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (session_id, user_id)
);

create table if not exists snack_payments (
  id bigint generated always as identity primary key,
  session_id bigint not null references snack_sessions(id) on delete cascade,
  user_id uuid not null references profiles(id),
  confirmed_at timestamptz default now(),
  unique (session_id, user_id)
);

create index if not exists idx_snack_orders_session on snack_orders(session_id);
create index if not exists idx_snack_payments_session on snack_payments(session_id);
