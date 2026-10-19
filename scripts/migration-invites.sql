-- Invite-first upgrade: run once in the Supabase SQL editor.
-- Safe to run on a project where seed.sql + migration-checkin.sql +
-- migration-web.sql were already applied.
--
-- New guest states: 'invited' (host added them) → 'registered' (confirmed),
-- 'declined' (said no), 'requested' (self-serve on /rsvp, awaiting a host).

alter table guests
  add column if not exists invite_id text unique,
  add column if not exists invited_at timestamptz,
  add column if not exists declined_at timestamptz,
  add column if not exists requested_at timestamptz;

create index if not exists guests_invite_id_idx on guests (invite_id);

-- Hosts' list now shows when the invite went out alongside confirmation and
-- door status. Dropped and recreated: CREATE OR REPLACE VIEW can't reorder
-- or insert columns into an existing view.
drop view if exists confirmed_guests;
create view confirmed_guests as
  select name, phone, email, invited_at, checked_in_at, created_at as confirmed_at
  from guests
  where state = 'registered'
  order by created_at;
