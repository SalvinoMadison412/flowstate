create table public.site_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event text not null check (event in ('demo_start','demo_end','demo_error','cta_click')),
  label text check (char_length(label) <= 80),
  path text check (char_length(path) <= 128)
);
alter table public.site_events enable row level security;
create policy "anon can insert events" on public.site_events for insert to anon with check (true);
grant insert on public.site_events to anon;
