-- Community RLS (run after community-schema.sql and rls-policies.sql)

alter table community_events enable row level security;
alter table discussion_posts enable row level security;
alter table itinerary_items enable row level security;
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;
alter table event_payments enable row level security;
alter table payment_confirmations enable row level security;
alter table chat_messages enable row level security;

-- community_events
drop policy if exists "community_events_select" on community_events;
drop policy if exists "community_events_insert" on community_events;
drop policy if exists "community_events_delete" on community_events;

create policy "community_events_select"
  on community_events for select to authenticated using (true);

create policy "community_events_insert"
  on community_events for insert to authenticated
  with check ((select auth.uid()) = created_by);

create policy "community_events_delete"
  on community_events for delete to authenticated
  using (
    (select auth.uid()) = created_by
    or (select public.is_admin())
  );

-- discussion_posts
drop policy if exists "discussion_posts_all" on discussion_posts;
create policy "discussion_posts_all"
  on discussion_posts for all to authenticated using (true)
  with check ((select auth.uid()) = user_id);

-- itinerary_items
drop policy if exists "itinerary_items_all" on itinerary_items;
create policy "itinerary_items_all"
  on itinerary_items for all to authenticated using (true)
  with check ((select auth.uid()) = suggested_by);

-- polls
drop policy if exists "polls_select" on polls;
drop policy if exists "polls_insert" on polls;
create policy "polls_select" on polls for select to authenticated using (true);
create policy "polls_insert" on polls for insert to authenticated
  with check ((select auth.uid()) = created_by);

-- poll_options
drop policy if exists "poll_options_select" on poll_options;
drop policy if exists "poll_options_insert" on poll_options;
create policy "poll_options_select" on poll_options for select to authenticated using (true);
create policy "poll_options_insert" on poll_options for insert to authenticated with check (true);

-- poll_votes
drop policy if exists "poll_votes_all" on poll_votes;
create policy "poll_votes_all"
  on poll_votes for all to authenticated using (true)
  with check ((select auth.uid()) = user_id);

-- event_payments
drop policy if exists "event_payments_select" on event_payments;
drop policy if exists "event_payments_insert" on event_payments;
create policy "event_payments_select" on event_payments for select to authenticated using (true);
create policy "event_payments_insert" on event_payments for insert to authenticated
  with check ((select auth.uid()) = created_by);

-- payment_confirmations
drop policy if exists "payment_confirmations_all" on payment_confirmations;
create policy "payment_confirmations_all"
  on payment_confirmations for all to authenticated using (true)
  with check ((select auth.uid()) = user_id);

-- chat_messages
drop policy if exists "chat_messages_all" on chat_messages;
create policy "chat_messages_all"
  on chat_messages for all to authenticated using (true)
  with check ((select auth.uid()) = user_id);
