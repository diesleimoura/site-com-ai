
CREATE TABLE public.site_generation_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  step text NOT NULL DEFAULT 'analyzing',
  progress integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX site_generation_jobs_site_id_idx ON public.site_generation_jobs(site_id);
CREATE INDEX site_generation_jobs_tenant_id_idx ON public.site_generation_jobs(tenant_id);

ALTER TABLE public.site_generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_select_own" ON public.site_generation_jobs
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "jobs_insert_own" ON public.site_generation_jobs
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "jobs_update_own" ON public.site_generation_jobs
  FOR UPDATE USING (auth.uid() = tenant_id);

CREATE TRIGGER set_site_generation_jobs_updated_at
  BEFORE UPDATE ON public.site_generation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.site_generation_jobs;
ALTER TABLE public.site_generation_jobs REPLICA IDENTITY FULL;
