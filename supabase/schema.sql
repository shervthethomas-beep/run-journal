-- Run this once in your Supabase project's SQL Editor
-- (Supabase dashboard -> SQL Editor -> New query -> paste this -> Run)

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  name text not null,
  department text not null,
  activity text not null,
  created_at timestamptz not null default now()
);

create index if not exists entries_entry_date_idx on entries (entry_date);

-- Row Level Security: this app has no login, so everyone shares one
-- "public" identity. These policies let anyone with your anon key
-- read and add entries, but never delete or edit others' entries.
alter table entries enable row level security;

create policy "Anyone can read entries"
  on entries for select
  using (true);

create policy "Anyone can add entries"
  on entries for insert
  with check (true);

-- Turn on realtime so every device sees new entries live.
alter publication supabase_realtime add table entries;
