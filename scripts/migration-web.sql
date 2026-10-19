-- Web RSVP upgrade: run once in the Supabase SQL editor.
-- Safe to run on a project where seed.sql + migration-checkin.sql were applied.

-- Rendered card/pass JPEGs (base64) so the web RSVP can serve them at
-- /media/{pass_id}/… — the raw guest selfie is still never stored.
alter table guests
  add column if not exists card_img text,
  add column if not exists pass_img text;

create index if not exists guests_email_idx on guests (email);
