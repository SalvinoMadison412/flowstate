-- The view ran as its owner (postgres), bypassing RLS, and anon could SELECT it:
-- the public anon key could read every CRM lead. Run it as the caller instead,
-- so crm_leads/crm_touches owner-only RLS applies.
alter view public.crm_leads_staged set (security_invoker = true);

-- Defense in depth: the CRM is owner-only (authenticated), anon never needs it.
revoke all on public.crm_leads_staged, public.crm_leads, public.crm_touches,
  public.crm_calls, public.crm_agencies, public.crm_time_entries from anon;
