-- Direct user-to-user messages (run once in Supabase SQL Editor)

create table if not exists direct_messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references profiles(id),
  receiver_id uuid not null references profiles(id),
  content text not null,
  created_at timestamptz default now(),
  check (sender_id <> receiver_id)
);

create index if not exists idx_direct_messages_pair
  on direct_messages (sender_id, receiver_id, created_at desc);

create index if not exists idx_direct_messages_receiver
  on direct_messages (receiver_id, created_at desc);
