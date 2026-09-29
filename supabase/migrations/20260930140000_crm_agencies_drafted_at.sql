-- Set by the email routine when it creates a Gmail draft for an agency, so it is not drafted twice.
alter table public.crm_agencies add column if not exists drafted_at timestamptz;
