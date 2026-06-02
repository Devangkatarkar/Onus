# Data retention (save Supabase space)

## What runs automatically

| Job | When (default `Asia/Kolkata`) | Action |
|-----|-------------------------------|--------|
| **Daily** | Every day at **12:00 AM** | Deletes **topics** (`community_events`) and **snack times** (`snack_sessions`) created **before today** |
| **Weekly** | Every **Sunday 11:00 PM** | **Backs up** that week’s attendance → `attendance_archive` + JSON in Storage `backups` bucket, then **deletes** those rows from `attendance` |

## Setup

### 1. SQL (Supabase SQL Editor)

Run once:

1. `supabase/attendance-archive.sql`

### 2. Environment variables (`.env.local`)

```env
CRON_SECRET=your-long-random-secret
CRON_TIMEZONE=Asia/Kolkata
SUPABASE_SERVICE_ROLE_KEY=...  # required for cron jobs
```

Restart the dev server after changing env.

### 3. Schedule the cron

**Option A – Vercel (if deployed there)**  
`vercel.json` is included. Add `CRON_SECRET` in Vercel env vars. Vercel Cron will call the API with the secret (configure in Vercel dashboard if needed).

**Option B – Any host / manual**  
Call weekly:

```http
GET https://your-app.com/api/cron/retention?job=weekly&secret=YOUR_CRON_SECRET
GET https://your-app.com/api/cron/retention?job=daily&secret=YOUR_CRON_SECRET
```

Or header: `Authorization: Bearer YOUR_CRON_SECRET`

**Option C – Supabase pg_cron**  
Run `supabase/pg-cron-retention.sql` (database-only, no JSON file backup).

### 4. Test locally

```http
GET http://localhost:3000/api/cron/retention?job=daily&force=true&secret=YOUR_CRON_SECRET
GET http://localhost:3000/api/cron/retention?job=weekly&force=true&secret=YOUR_CRON_SECRET
```

`force=true` runs immediately regardless of clock time.

## View archived attendance

Admins can query in Supabase:

```sql
select * from attendance_archive
order by archived_at desc
limit 100;
```

JSON backups: Storage → bucket `backups` → `attendance/{week_label}.json`.
