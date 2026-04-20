
Brazil is UTC-3, so midnight BRT = 03:00 UTC. Change the cron expression from `0 0 1 * *` to `0 3 1 * *`.

## Plan

Create a new migration that unschedules the existing `reset-monthly-usage-counters` job and reschedules it with `0 3 1 * *` (03:00 UTC = 00:00 BRT) on the 1st of every month. Same SQL body, only the cron expression changes.

## Note
Brazil no longer observes DST, so UTC-3 is stable year-round — no adjustment needed.
