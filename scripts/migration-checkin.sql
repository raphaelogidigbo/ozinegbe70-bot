-- Check-in upgrade: run once in the Supabase SQL editor.
-- Safe to run on a project where seed.sql was already applied.

alter table guests
  add column if not exists email text,
  add column if not exists pass_id text unique,
  add column if not exists pass_media_id text,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by text;

create index if not exists guests_pass_id_idx on guests (pass_id);

-- Hosts' RSVP list now also shows who's through the door.
create or replace view confirmed_guests as
  select name, phone, email, checked_in_at, created_at as confirmed_at
  from guests
  where state = 'registered'
  order by created_at;
