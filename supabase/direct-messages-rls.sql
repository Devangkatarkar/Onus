alter table direct_messages enable row level security;

drop policy if exists "direct_messages_select" on direct_messages;
drop policy if exists "direct_messages_insert" on direct_messages;

create policy "direct_messages_select"
  on direct_messages for select to authenticated
  using (
    (select auth.uid()) = sender_id
    or (select auth.uid()) = receiver_id
  );

create policy "direct_messages_insert"
  on direct_messages for insert to authenticated
  with check ((select auth.uid()) = sender_id);
