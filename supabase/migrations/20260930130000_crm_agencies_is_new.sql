-- "New leads" = rows inserted by the scraper after the initial load. Additive.
alter table public.crm_agencies add column if not exists is_new boolean not null default true;
-- One-off at deploy time (already run): mark the initial 66 as not new.
-- update public.crm_agencies set is_new = false;
