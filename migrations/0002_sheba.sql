-- Sheba Music core schema. Idempotent. No extensions (PGLite + Neon parity).
-- Money is integer minor units (pesewas / cents). Never trust client amounts.

create table if not exists profiles (
  id text primary key,
  username text unique not null,
  display_name text not null,
  role text not null default 'fan',
  country text,
  bio text,
  avatar_url text,
  banner_url text,
  favorite_genres text,
  location_opt_in boolean not null default false,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists artist_profiles (
  user_id text primary key references profiles(id) on delete cascade,
  artist_name text not null,
  legal_name text,
  verification_status text not null default 'unverified',
  monthly_listeners integer not null default 0,
  biography text,
  socials text,
  payout_ready boolean not null default false,
  genres text,
  created_at timestamptz not null default now()
);

create table if not exists artist_verification (
  id text primary key,
  artist_id text not null references artist_profiles(user_id) on delete cascade,
  status text not null default 'pending',
  notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists genres (
  id text primary key,
  name text not null,
  slug text unique not null
);

create table if not exists albums (
  id text primary key,
  artist_id text not null references artist_profiles(user_id),
  title text not null,
  description text,
  cover_url text not null,
  release_date date,
  album_type text not null default 'album',
  price_cents integer not null default 0,
  currency text not null default 'GHS',
  visibility text not null default 'public'
);

create table if not exists tracks (
  id text primary key,
  artist_id text not null references artist_profiles(user_id),
  album_id text references albums(id),
  title text not null,
  cover_url text not null,
  audio_url text not null,
  duration_ms integer not null default 0,
  genre text,
  subgenre text,
  language text,
  distribution text not null default 'free_stream',
  price_cents integer not null default 0,
  currency text not null default 'GHS',
  explicit boolean not null default false,
  isrc text,
  lyrics text,
  copyright_owner text,
  featured_artists text,
  producer text,
  songwriter text,
  status text not null default 'published',
  play_count integer not null default 0,
  like_count integer not null default 0,
  sort_order integer not null default 0,
  country text,
  created_at timestamptz not null default now()
);

create table if not exists track_genres (
  track_id text not null references tracks(id) on delete cascade,
  genre_id text not null references genres(id),
  primary key (track_id, genre_id)
);

create table if not exists playlists (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  cover_url text,
  is_public boolean not null default true,
  is_system boolean not null default false,
  kind text not null default 'custom',
  created_at timestamptz not null default now()
);

create table if not exists playlist_tracks (
  playlist_id text not null references playlists(id) on delete cascade,
  track_id text not null references tracks(id) on delete cascade,
  position integer not null default 0,
  primary key (playlist_id, track_id)
);

create table if not exists favorites (
  user_id text not null references profiles(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create table if not exists follows (
  follower_id text not null references profiles(id) on delete cascade,
  following_id text not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

create table if not exists listening_history (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  track_id text not null references tracks(id) on delete cascade,
  played_at timestamptz not null default now(),
  duration_ms integer not null default 0,
  completed boolean not null default false
);

create table if not exists stream_events (
  id text primary key,
  user_id text,
  track_id text not null references tracks(id) on delete cascade,
  device_hash text,
  started_at timestamptz not null default now(),
  listened_ms integer not null default 0,
  meaningful boolean not null default false
);

create table if not exists commission_rules (
  id text primary key,
  product_type text not null,
  platform_bps integer not null,
  processor_bps integer not null default 0,
  min_payout_cents integer not null default 0,
  currency text not null default 'GHS'
);

create table if not exists purchases (
  id text primary key,
  buyer_id text not null references profiles(id),
  status text not null default 'completed',
  currency text not null,
  gross_cents integer not null,
  processor_fee_cents integer not null,
  platform_fee_cents integer not null,
  creator_cents integer not null,
  fee_snapshot text not null,
  created_at timestamptz not null default now()
);

create table if not exists purchase_items (
  id text primary key,
  purchase_id text not null references purchases(id) on delete cascade,
  item_type text not null,
  item_id text not null,
  title text not null,
  price_cents integer not null
);

create table if not exists licenses (
  id text primary key,
  purchase_id text not null references purchases(id),
  user_id text not null references profiles(id),
  track_id text not null references tracks(id),
  license_type text not null,
  rights_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists wallets (
  user_id text primary key references profiles(id) on delete cascade,
  currency text not null default 'GHS',
  created_at timestamptz not null default now()
);

create table if not exists ledger_entries (
  id text primary key,
  wallet_user_id text not null references wallets(user_id),
  amount_cents integer not null,
  direction text not null,
  kind text not null,
  ref_type text,
  ref_id text,
  available boolean not null default true,
  meta text,
  created_at timestamptz not null default now()
);

create table if not exists payout_requests (
  id text primary key,
  artist_id text not null references artist_profiles(user_id),
  amount_cents integer not null,
  currency text not null default 'GHS',
  method text not null,
  destination text,
  status text not null default 'requested',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists payment_transactions (
  id text primary key,
  user_id text not null,
  provider text not null,
  provider_ref text,
  amount_cents integer not null,
  currency text not null,
  status text not null,
  purpose text not null,
  created_at timestamptz not null default now()
);

create table if not exists subscription_plans (
  id text primary key,
  name text not null,
  price_cents integer not null,
  currency text not null default 'GHS',
  interval text not null default 'month',
  features text
);

create table if not exists subscriptions (
  user_id text not null references profiles(id) on delete cascade,
  plan_id text not null references subscription_plans(id),
  status text not null default 'active',
  current_period_end timestamptz,
  primary key (user_id, plan_id)
);

create table if not exists events (
  id text primary key,
  organizer_id text not null references profiles(id),
  title text not null,
  poster_url text not null,
  venue text,
  city text,
  country text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  description text,
  status text not null default 'published'
);

create table if not exists event_ticket_types (
  id text primary key,
  event_id text not null references events(id) on delete cascade,
  name text not null,
  price_cents integer not null,
  currency text not null default 'GHS',
  capacity integer not null default 100,
  sold integer not null default 0
);

create table if not exists tickets (
  id text primary key,
  ticket_type_id text not null references event_ticket_types(id),
  event_id text not null references events(id),
  buyer_id text not null references profiles(id),
  code text unique not null,
  qr_payload text not null,
  status text not null default 'valid',
  created_at timestamptz not null default now()
);

create table if not exists ticket_scans (
  id text primary key,
  ticket_id text not null references tickets(id),
  scanner_user_id text,
  result text not null,
  scanned_at timestamptz not null default now()
);

create table if not exists live_events (
  id text primary key,
  artist_id text not null references artist_profiles(user_id),
  title text not null,
  poster_url text not null,
  description text,
  starts_at timestamptz not null,
  price_cents integer not null default 0,
  is_free boolean not null default false,
  capacity integer,
  status text not null default 'scheduled'
);

create table if not exists live_entitlements (
  user_id text not null references profiles(id) on delete cascade,
  live_event_id text not null references live_events(id) on delete cascade,
  purchased_at timestamptz not null default now(),
  primary key (user_id, live_event_id)
);

create table if not exists video_call_services (
  artist_id text primary key references artist_profiles(user_id),
  duration_min integer not null default 15,
  price_cents integer not null,
  currency text not null default 'GHS',
  available boolean not null default true
);

create table if not exists bookings (
  id text primary key,
  artist_id text not null references artist_profiles(user_id),
  fan_id text not null references profiles(id),
  starts_at timestamptz not null,
  duration_min integer not null,
  price_cents integer not null,
  currency text not null default 'GHS',
  status text not null default 'confirmed'
);

create table if not exists posts (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  body text not null,
  image_url text,
  track_id text references tracks(id),
  event_id text references events(id),
  like_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  parent_id text,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id text primary key,
  created_at timestamptz not null default now()
);

create table if not exists conversation_members (
  conversation_id text not null references conversations(id) on delete cascade,
  user_id text not null references profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table if not exists messages (
  id text primary key,
  conversation_id text not null references conversations(id) on delete cascade,
  sender_id text not null references profiles(id),
  body text not null,
  image_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists notifications (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  category text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists device_tokens (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  token text not null,
  platform text not null
);

create table if not exists reports (
  id text primary key,
  reporter_id text not null references profiles(id),
  target_type text not null,
  target_id text not null,
  reason text not null,
  status text not null default 'open',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists copyright_claims (
  id text primary key,
  track_id text not null references tracks(id),
  claimant_name text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists admin_actions (
  id text primary key,
  admin_id text not null,
  action text not null,
  target_type text,
  target_id text,
  meta text,
  created_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id text primary key,
  user_id text,
  name text not null,
  props text,
  created_at timestamptz not null default now()
);

create table if not exists feature_flags (
  key text primary key,
  enabled boolean not null default true,
  payload text
);

create table if not exists remote_config (
  key text primary key,
  value text not null
);

create table if not exists articles (
  id text primary key,
  title text not null,
  slug text unique not null,
  category text not null,
  excerpt text,
  body text not null,
  cover_url text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists search_log (
  id text primary key,
  user_id text,
  query text not null,
  created_at timestamptz not null default now()
);

create index if not exists tracks_artist_idx on tracks (artist_id);
create index if not exists tracks_genre_idx on tracks (genre);
create index if not exists tracks_status_idx on tracks (status);
create index if not exists tracks_play_idx on tracks (play_count desc);
create index if not exists albums_artist_idx on albums (artist_id);
create index if not exists history_user_idx on listening_history (user_id, played_at desc);
create index if not exists stream_track_idx on stream_events (track_id, started_at desc);
create index if not exists ledger_wallet_idx on ledger_entries (wallet_user_id, created_at desc);
create index if not exists posts_created_idx on posts (created_at desc);
create index if not exists comments_target_idx on comments (target_type, target_id);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);
create index if not exists events_starts_idx on events (starts_at);
create index if not exists favorites_target_idx on favorites (target_type, target_id);
