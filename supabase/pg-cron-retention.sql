-- Optional: Supabase pg_cron (if enabled on your project)
-- Dashboard → Database → Extensions → enable pg_cron
-- Schedules use UTC. Adjust times for your timezone.
-- IST (UTC+5:30): daily midnight IST ≈ 18:30 UTC; Sunday 11pm IST ≈ 17:30 UTC

create extension if not exists pg_cron with schema extensions;

-- Remove old jobs if re-running
select cron.unschedule(jobid)
from cron.job
where jobname in ('onus_daily_community_cleanup', 'onus_weekly_attendance_archive');

-- Daily: delete topics & snack times older than 1 day
select cron.schedule(
  'onus_daily_community_cleanup',
  '30 18 * * *',
  $$
    delete from community_events where created_at < now() - interval '1 day';
    delete from snack_sessions where created_at < now() - interval '1 day';
  $$
);

-- Weekly: archive attendance then delete (same week Mon–Sun by date)
select cron.schedule(
  'onus_weekly_attendance_archive',
  '30 17 * * 0',
  $$
    insert into attendance_archive (
      original_id, user_id, attendance_date, marked_at, latitude, longitude, week_label
    )
    select
      a.id,
      a.user_id,
      a.attendance_date,
      a.marked_at,
      a.latitude,
      a.longitude,
      to_char(date_trunc('week', a.attendance_date::timestamp), 'IYYY-"W"IW')
    from attendance a
    where a.attendance_date >= date_trunc('week', current_date)::date
      and a.attendance_date <= (date_trunc('week', current_date) + interval '6 days')::date;

    delete from attendance
    where attendance_date >= date_trunc('week', current_date)::date
      and attendance_date <= (date_trunc('week', current_date) + interval '6 days')::date;
  $$
);

-- Prefer the app cron API (/api/cron/retention) for JSON backups to Storage.
