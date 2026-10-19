
create table if not exists guests (
  id bigint generated always as identity primary key,
  phone text not null unique,
  name text,
  state text not null default 'awaiting_name',
  card_media_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guests_state_idx on guests (state);

create table if not exists processed_messages (
  id text primary key,
  created_at timestamptz not null default now()
);

create or replace view confirmed_guests as
  select name, phone, created_at as confirmed_at
  from guests
  where state = 'registered'
  order by created_at;
