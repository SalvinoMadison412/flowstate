-- B2B tab: white-label agency partners. Additive and idempotent.
create table if not exists public.crm_agencies (
  id uuid primary key default gen_random_uuid(),
  agency_name text not null,
  target_niche text,
  website text,
  -- Dedup key: lowercase host with scheme/www/path stripped.
  domain text generated always as (
    lower(regexp_replace(regexp_replace(coalesce(website, ''), '^https?://(www\.)?', ''), '/.*$', ''))
  ) stored,
  founder_name text,
  founder_linkedin text,
  agency_linkedin text,
  country text,
  date_added date,
  -- The only fields typed by hand in the CRM.
  email text,
  phone text,
  inbox_enabled text not null default 'unknown'
    check (inbox_enabled in ('unknown', 'linkedin', 'email', 'both', 'neither')),
  -- Stamped when an email goes out; the sourcing scraper reads it.
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists crm_agencies_domain_key on public.crm_agencies (domain) where domain <> '';
create unique index if not exists crm_agencies_name_key on public.crm_agencies (lower(agency_name));
create unique index if not exists crm_agencies_email_key on public.crm_agencies (lower(email)) where email is not null and email <> '';

alter table public.crm_agencies enable row level security;
drop policy if exists crm_agencies_owner on public.crm_agencies;
create policy crm_agencies_owner on public.crm_agencies
  for all to authenticated
  using (auth.email() = 'salvinokevin7@gmail.com')
  with check (auth.email() = 'salvinokevin7@gmail.com');
