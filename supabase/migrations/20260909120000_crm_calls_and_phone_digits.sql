-- Dialer support: a call-history table and a match-friendly phone column.
--
-- Apply with the Supabase SQL editor (dashboard → SQL) or `supabase db push`.
-- Additive and idempotent; safe to run on the live project.

-- One row per phone call placed or received through the Chrome dialer.
create table if not exists public.crm_calls (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads (id) on delete set null,
  phone_number text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  status text not null default 'completed' check (
    status in (
      'queued', 'ringing', 'in-progress', 'completed',
      'busy', 'failed', 'no-answer', 'canceled'
    )
  ),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  notes text,
  recording_url text,
  twilio_call_sid text unique,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.crm_calls enable row level security;

-- Same owner-only lock as every other crm_* table.
drop policy if exists crm_calls_owner on public.crm_calls;
create policy crm_calls_owner on public.crm_calls
  for all to authenticated
  using (auth.email() = 'salvinokevin7@gmail.com')
  with check (auth.email() = 'salvinokevin7@gmail.com');

create index if not exists crm_calls_lead_id_idx on public.crm_calls (lead_id);
create index if not exists crm_calls_occurred_at_idx on public.crm_calls (occurred_at desc);

-- Digits-only mirror of crm_leads.phone, so an inbound E.164 number ("+33612345678")
-- matches a lead however the stored number is punctuated ("+33 6 12 34 56 78").
alter table public.crm_leads
  add column if not exists phone_digits text
  generated always as (regexp_replace(coalesce(phone, ''), '\D', '', 'g')) stored;

create index if not exists crm_leads_phone_digits_idx on public.crm_leads (phone_digits);

-- Note: crm_leads_staged lists its columns explicitly and does not select l.*,
-- so this new generated column does not require the view to be recreated. Phone
-- lookups from the dialer query crm_leads directly.
