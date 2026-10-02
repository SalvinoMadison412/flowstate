-- Third lead channel, "niche": direct (non-agency) clients from the niche sourcing routine.
alter table crm_leads drop constraint crm_leads_channel_check;
alter table crm_leads add constraint crm_leads_channel_check
  check (channel = any (array['cold_call','outreach','niche']));
alter table crm_leads drop constraint crm_leads_channels_valid;
alter table crm_leads add constraint crm_leads_channels_valid
  check (channels <@ array['cold_call','outreach','niche'] and array_length(channels, 1) >= 1);
