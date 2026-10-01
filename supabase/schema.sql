-- Bathroom Ranker schema
-- Run this in the Supabase SQL editor

create extension if not exists "uuid-ossp";

create table if not exists public.bathrooms (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users (id) on delete set null,
  toilet_rating numeric(3, 1) not null check (toilet_rating >= 1 and toilet_rating <= 10),
  sink_rating numeric(3, 1) not null check (sink_rating >= 1 and sink_rating <= 10),
  floor_rating numeric(3, 1) not null check (floor_rating >= 1 and floor_rating <= 10),
  overall_rating numeric(3, 1) not null check (overall_rating >= 1 and overall_rating <= 10),
  notes text default '',
  location_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now()
);

create index if not exists bathrooms_created_at_idx on public.bathrooms (created_at desc);
create index if not exists bathrooms_overall_rating_idx on public.bathrooms (overall_rating desc);
create index if not exists bathrooms_location_name_idx on public.bathrooms using gin (to_tsvector('english', location_name));

alter table public.bathrooms enable row level security;

create policy "Anyone can read bathrooms"
  on public.bathrooms
  for select
  using (true);

create policy "Authenticated users can insert bathrooms"
  on public.bathrooms
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own bathrooms"
  on public.bathrooms
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own bathrooms"
  on public.bathrooms
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Allow guests to insert ratings without a user_id (anonymous submissions)
create policy "Guests can insert bathrooms"
  on public.bathrooms
  for insert
  to anon
  with check (user_id is null);
