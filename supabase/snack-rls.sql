alter table snack_sessions enable row level security;
alter table snack_orders enable row level security;
alter table snack_payments enable row level security;

-- snack_sessions
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

-- snack_orders
drop policy if exists "snack_orders_select" on snack_orders;
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

-- snack_payments
drop policy if exists "snack_payments_select" on snack_payments;
drop policy if exists "snack_payments_insert" on snack_payments;

create policy "snack_payments_select"
  on snack_payments for select to authenticated using (true);

create policy "snack_payments_insert"
  on snack_payments for insert to authenticated
  with check ((select auth.uid()) = user_id);
