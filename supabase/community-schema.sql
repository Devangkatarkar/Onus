-- Community module tables (run once in Supabase SQL Editor)
-- Does not modify profiles, office_settings, or attendance.

create table if not exists community_events (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  event_date timestamptz,
  location text,
  created_by uuid not null references profiles(id),
  created_at timestamptz default now()
);

create table if not exists discussion_posts (
  id bigint generated always as identity primary key,
  event_id bigint not null references community_events(id) on delete cascade,
  user_id uuid not null references profiles(id),
  content text not null,
  created_at timestamptz default now()
);

create table if not exists itinerary_items (
  id bigint generated always as identity primary key,
  event_id bigint not null references community_events(id) on delete cascade,
  title text not null,
  description text,
  suggested_by uuid not null references profiles(id),
  created_at timestamptz default now()
);

create table if not exists polls (
  id bigint generated always as identity primary key,
  event_id bigint not null references community_events(id) on delete cascade,
  question text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz default now()
);

create table if not exists poll_options (
  id bigint generated always as identity primary key,
  poll_id bigint not null references polls(id) on delete cascade,
  option_text text not null
);

create table if not exists poll_votes (
  id bigint generated always as identity primary key,
  poll_id bigint not null references polls(id) on delete cascade,
  option_id bigint not null references poll_options(id) on delete cascade,
  user_id uuid not null references profiles(id),
  unique (poll_id, user_id)
);

create table if not exists event_payments (
  id bigint generated always as identity primary key,
  event_id bigint not null references community_events(id) on delete cascade,
  title text not null,
  amount numeric(10, 2),
  payment_link text,
  created_by uuid not null references profiles(id),
  created_at timestamptz default now()
);

create table if not exists payment_confirmations (
  id bigint generated always as identity primary key,
  payment_id bigint not null references event_payments(id) on delete cascade,
  user_id uuid not null references profiles(id),
  confirmed_at timestamptz default now(),
  unique (payment_id, user_id)
);

create table if not exists chat_messages (
  id bigint generated always as identity primary key,
  event_id bigint not null references community_events(id) on delete cascade,
  user_id uuid not null references profiles(id),
  message text not null,
  created_at timestamptz default now()
);

create index if not exists idx_discussion_posts_event on discussion_posts(event_id);
create index if not exists idx_itinerary_items_event on itinerary_items(event_id);
create index if not exists idx_polls_event on polls(event_id);
create index if not exists idx_chat_messages_event on chat_messages(event_id);
