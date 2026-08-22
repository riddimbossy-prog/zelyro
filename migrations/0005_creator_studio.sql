-- Creator studio extras. Replay-safe.

alter table tracks add column if not exists mood text;

alter table profiles add column if not exists available boolean not null default false;

create table if not exists video_chat_sessions (
  id text primary key,
  artist_id text not null references artist_profiles(user_id),
  fan_id text references profiles(id),
  duration_min integer not null default 15,
  price_cents integer not null default 0,
  currency text not null default 'USD',
  status text not null default 'waiting',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists video_chat_artist_idx on video_chat_sessions (artist_id, created_at desc);
