
Simple SQL-only cron job — no server route needed since it's pure UPDATE.

## Plan

**1. Create migration enabling `pg_cron`** and scheduling a job named `reset-monthly-usage-counters`:
- Cron expression: `0 0 1 * *` (00:00 UTC on the 1st of every month)
- SQL: `UPDATE public.profiles SET sites_created_this_month = 0, searches_used_this_month = 0;`

That's it. One migration, one cron job. Uses Option 1 (SQL-only) from the scheduling docs — no HTTP call, no auth, no edge function.

## Out of scope
- Per-user reset based on `plan_expires_at` (would need a more complex job)
- Audit log of resets
- Timezone configuration (UTC is fine; can revisit if user wants Brazil time)
