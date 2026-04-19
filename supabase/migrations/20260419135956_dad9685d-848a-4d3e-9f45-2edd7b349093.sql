create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  slug text unique,
  custom_domain text,
  plan text not null default 'free' check (plan in ('free','pro','agency')),
  plan_expires_at timestamptz,
  pix_key_type text,
  pix_key text,
  affiliate_active boolean not null default false,
  affiliate_code text unique,
  searches_used_this_month int not null default 0,
  sites_created_this_month int not null default 0,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  segment text,
  city text,
  address text,
  phone text,
  whatsapp text,
  google_place_id text,
  html_content text,
  status text not null default 'rascunho' check (status in ('rascunho','proposta_enviada','fechado','publicado')),
  is_published boolean not null default false,
  setup_price numeric(10,2) default 497,
  monthly_price numeric(10,2) default 49,
  logo_url text,
  ai_edits_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.sites enable row level security;
create policy "sites_select_own" on public.sites for select using (auth.uid() = tenant_id);
create policy "sites_insert_own" on public.sites for insert with check (auth.uid() = tenant_id);
create policy "sites_update_own" on public.sites for update using (auth.uid() = tenant_id);
create policy "sites_delete_own" on public.sites for delete using (auth.uid() = tenant_id);
create trigger sites_updated_at before update on public.sites for each row execute function public.set_updated_at();
create index sites_tenant_idx on public.sites(tenant_id);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  tenant_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  client_name text,
  client_email text,
  client_phone text,
  setup_price numeric(10,2) not null default 497,
  monthly_price numeric(10,2) not null default 49,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed')),
  payment_method text check (payment_method in ('pix','card')),
  pix_code text,
  pix_qr_code text,
  paid_at timestamptz,
  status text not null default 'draft' check (status in ('draft','sent','viewed','accepted')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.proposals enable row level security;
create policy "proposals_select_own" on public.proposals for select using (auth.uid() = tenant_id);
create policy "proposals_insert_own" on public.proposals for insert with check (auth.uid() = tenant_id);
create policy "proposals_update_own" on public.proposals for update using (auth.uid() = tenant_id);
create policy "proposals_delete_own" on public.proposals for delete using (auth.uid() = tenant_id);
create trigger proposals_updated_at before update on public.proposals for each row execute function public.set_updated_at();
create index proposals_token_idx on public.proposals(token);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  tenant_id uuid not null references auth.users(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete set null,
  client_name text,
  monthly_price numeric(10,2) not null,
  status text not null default 'active' check (status in ('active','paused','cancelled')),
  next_billing_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "subs_select_own" on public.subscriptions for select using (auth.uid() = tenant_id);
create policy "subs_insert_own" on public.subscriptions for insert with check (auth.uid() = tenant_id);
create policy "subs_update_own" on public.subscriptions for update using (auth.uid() = tenant_id);
create policy "subs_delete_own" on public.subscriptions for delete using (auth.uid() = tenant_id);
create trigger subs_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('site_sale','monthly_fee','affiliate_commission','withdrawal')),
  amount numeric(10,2) not null,
  net_amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending','available','withdrawn')),
  available_at timestamptz,
  proposal_id uuid references public.proposals(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.wallet_transactions enable row level security;
create policy "wallet_select_own" on public.wallet_transactions for select using (auth.uid() = tenant_id);
create policy "wallet_insert_own" on public.wallet_transactions for insert with check (auth.uid() = tenant_id);

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  pix_key text not null,
  pix_key_type text not null,
  status text not null default 'pending' check (status in ('pending','approved','paid','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.withdrawals enable row level security;
create policy "withdrawals_select_own" on public.withdrawals for select using (auth.uid() = tenant_id);
create policy "withdrawals_insert_own" on public.withdrawals for insert with check (auth.uid() = tenant_id);
create trigger withdrawals_updated_at before update on public.withdrawals for each row execute function public.set_updated_at();

create table public.prospect_searches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references auth.users(id) on delete cascade,
  segment text not null,
  city text not null,
  radius_km int not null default 5,
  results_cache jsonb,
  cache_expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.prospect_searches enable row level security;
create policy "prospect_select_own" on public.prospect_searches for select using (auth.uid() = tenant_id);
create policy "prospect_insert_own" on public.prospect_searches for insert with check (auth.uid() = tenant_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  final_slug text;
  attempt int := 0;
  aff_code text;
begin
  base_slug := lower(regexp_replace(coalesce(split_part(new.email,'@',1),'user'), '[^a-z0-9]+','-','g'));
  if base_slug = '' then base_slug := 'user'; end if;
  final_slug := base_slug;
  while exists (select 1 from public.profiles where slug = final_slug) loop
    attempt := attempt + 1;
    final_slug := base_slug || '-' || attempt::text;
  end loop;
  aff_code := upper(substr(md5(new.id::text || clock_timestamp()::text), 1, 8));
  insert into public.profiles (id, email, slug, affiliate_code)
  values (new.id, new.email, final_slug, aff_code);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();