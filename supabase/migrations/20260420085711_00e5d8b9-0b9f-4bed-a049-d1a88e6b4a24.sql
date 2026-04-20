CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('reset-monthly-usage-counters')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reset-monthly-usage-counters');

SELECT cron.schedule(
  'reset-monthly-usage-counters',
  '0 0 1 * *',
  $$UPDATE public.profiles SET sites_created_this_month = 0, searches_used_this_month = 0;$$
);