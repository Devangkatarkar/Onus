-- Weekly attendance backup table (keeps history after live data is cleared)

create table if not exists attendance_archive (
  id bigint generated always as identity primary key,
  original_id bigint not null,
  user_id uuid not null,
  attendance_date date not null,
  marked_at timestamptz not null,
  latitude double precision,
  longitude double precision,
  week_label text not null,
  archived_at timestamptz default now()
);

create index if not exists idx_attendance_archive_week on attendance_archive(week_label);
create index if not exists idx_attendance_archive_date on attendance_archive(attendance_date);

alter table attendance_archive enable row level security;

drop policy if exists "attendance_archive_admin_select" on attendance_archive;
drop policy if exists "attendance_archive_service" on attendance_archive;

-- Admins can read archives in the app (optional)
create policy "attendance_archive_admin_select"
  on attendance_archive for select to authenticated
  using ((select public.is_admin()));

-- Storage bucket for JSON exports (optional weekly file backup)
insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;

drop policy if exists "backups_service_only" on storage.objects;
-- Backups are written via service role from cron API only (no client policy)
