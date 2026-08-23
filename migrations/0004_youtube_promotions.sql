-- YouTube promotion, external music links, nearby studios.
-- DJ is not an account type: existing DJ profiles become artists.

update profiles set role = 'artist' where role = 'dj';

create table if not exists youtube_connections (
  artist_id text primary key references artist_profiles(user_id) on delete cascade,
  channel_id text not null,
  channel_url text not null,
  channel_name text not null,
  avatar_url text,
  subscriber_count integer,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists external_music_links (
  id text primary key,
  artist_id text not null references artist_profiles(user_id) on delete cascade,
  provider text not null,
  external_url text not null,
  external_content_id text,
  title text,
  thumbnail_url text,
  channel_name text,
  channel_id text,
  description text,
  published_at timestamptz,
  duration_seconds integer,
  category text not null default 'music_video',
  is_featured boolean not null default false,
  is_promoted boolean not null default false,
  embeddable boolean not null default true,
  public_stats text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists promotion_campaigns (
  id text primary key,
  creator_id text not null references profiles(id),
  content_type text not null,
  content_id text,
  external_music_link_id text references external_music_links(id),
  campaign_name text not null,
  description text,
  status text not null default 'draft',
  budget_cents integer not null default 0,
  daily_budget_cents integer not null default 0,
  spent_cents integer not null default 0,
  currency text not null default 'GHS',
  start_date date,
  end_date date,
  target_countries text,
  target_genres text,
  target_audience text,
  rejection_reason text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists promotion_targets (
  id text primary key,
  campaign_id text not null references promotion_campaigns(id) on delete cascade,
  target_type text not null,
  target_value text not null
);

create table if not exists promotion_impressions (
  id text primary key,
  campaign_id text not null references promotion_campaigns(id) on delete cascade,
  user_id text,
  created_at timestamptz not null default now()
);

create table if not exists promotion_clicks (
  id text primary key,
  campaign_id text not null references promotion_campaigns(id) on delete cascade,
  user_id text,
  kind text not null default 'card',
  created_at timestamptz not null default now()
);

create table if not exists promotion_engagement (
  id text primary key,
  campaign_id text not null references promotion_campaigns(id) on delete cascade,
  user_id text,
  event_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists producer_profiles (
  user_id text primary key references profiles(id) on delete cascade,
  display_title text,
  beats text,
  portfolio text,
  services text,
  credits text,
  location text,
  available_for_collab boolean not null default true,
  socials text,
  youtube_url text,
  contact text
);

create table if not exists studios (
  id text primary key,
  name text not null,
  city text,
  country text,
  kind text not null default 'recording',
  description text
);

create index if not exists eml_artist_idx on external_music_links (artist_id);
create index if not exists eml_provider_idx on external_music_links (provider);
create index if not exists eml_content_idx on external_music_links (external_content_id);
create index if not exists promo_status_idx on promotion_campaigns (status, start_date);
create index if not exists promo_creator_idx on promotion_campaigns (creator_id);
create index if not exists promo_imp_idx on promotion_impressions (campaign_id, created_at);
create index if not exists promo_click_idx on promotion_clicks (campaign_id, created_at);
create index if not exists promo_eng_idx on promotion_engagement (campaign_id, created_at);

-- Producer extras (Ebo already has an artist_profiles row for catalog work).
insert into producer_profiles (user_id, display_title, beats, services, credits, location, available_for_collab, youtube_url, contact)
values (
  'sys_ebo',
  'Analog desk, UK bars, night-market drums',
  'Hip hop kits, live brass stems, voice notes',
  'Beat lease, mix, feature verse',
  'Kofi Blade — Night Market; Yaw Lion — Rooftop Fire',
  'New York',
  true,
  'https://youtube.com/@verzzify',
  'studio@verzzify.com'
) on conflict (user_id) do nothing;

insert into studios (id, name, city, country, kind, description) values
  ('st_labadi', 'Labadi Tape Room', 'Accra', 'GH', 'recording', 'Seaside booth, analog board.'),
  ('st_ikeja', 'Ikeja Terrace Studio', 'Lagos', 'NG', 'recording', 'Tracking rooms, wet terrace after rain.'),
  ('st_hackney', 'Hackney Night Desk', 'London', 'GB', 'recording', 'Late sessions under the overground.'),
  ('st_bushwick', 'Bushwick Room', 'New York', 'US', 'recording', 'Analog board, East River after midnight.'),
  ('st_kingston', 'Harbour Light', 'Kingston', 'JM', 'recording', 'Rooftop dancehall, no water.')
on conflict (id) do nothing;

-- Official YouTube videos promoted inside VerzZify. Metadata is stored so the
-- catalog works without a Data API key; playback always uses YouTube itself.
insert into external_music_links (
  id, artist_id, provider, external_url, external_content_id, title, thumbnail_url,
  channel_name, channel_id, description, duration_seconds, category, is_featured, is_promoted, embeddable
) values
  (
    'eml_kwaku', 'sys_ama', 'youtube',
    'https://www.youtube.com/watch?v=GIDiI5kyBDQ', 'GIDiI5kyBDQ',
    'Black Sherif - Kwaku the Traveller (Official Video)',
    'https://i.ytimg.com/vi/GIDiI5kyBDQ/hqdefault.jpg',
    'Black Sherif Music', 'UCKfrbVDBEq-wcYC4rUzEosA',
    'Official video. VerzZify does not host this file.',
    213, 'music_video', true, true, true
  ),
  (
    'eml_terminator', 'sys_kofi', 'youtube',
    'https://www.youtube.com/watch?v=NPCC02SaJVg', 'NPCC02SaJVg',
    'King Promise - Terminator feat. Young Jonn (Official Video)',
    'https://i.ytimg.com/vi/NPCC02SaJVg/hqdefault.jpg',
    'King Promise Official', 'UCHhS8FHRTxM7ysMKRUl3LHQ',
    'Official video. VerzZify does not host this file.',
    244, 'music_video', true, true, true
  ),
  (
    'eml_lastlast', 'sys_nia', 'youtube',
    'https://www.youtube.com/watch?v=421w1j87fEM', '421w1j87fEM',
    'Burna Boy - Last Last [Official Music Video]',
    'https://i.ytimg.com/vi/421w1j87fEM/hqdefault.jpg',
    'Burna Boy', 'UCEzDdNqNkT-7rSfSGSr1hWg',
    'Official video. VerzZify does not host this file.',
    174, 'music_video', true, true, true
  ),
  (
    'eml_tanzania', 'sys_lila', 'youtube',
    'https://www.youtube.com/watch?v=WvxADzZMkEI', 'WvxADzZMkEI',
    'Uncle Waffles and Tony Duardo - Tanzania (Official Music Video)',
    'https://i.ytimg.com/vi/WvxADzZMkEI/hqdefault.jpg',
    'Uncle Waffles', 'UCDfH7E8iHkEjmZ6H9uQ5o1g',
    'Official video. VerzZify does not host this file.',
    236, 'music_video', true, true, true
  ),
  (
    'eml_warehouseyt', 'sys_wave', 'youtube',
    'https://www.youtube.com/watch?v=WvxADzZMkEI', 'WvxADzZMkEI',
    'Uncle Waffles and Tony Duardo - Tanzania (Official Music Video)',
    'https://i.ytimg.com/vi/WvxADzZMkEI/hqdefault.jpg',
    'Uncle Waffles', 'UCDfH7E8iHkEjmZ6H9uQ5o1g',
    'Amapiano night, official YouTube. VerzZify does not host this file.',
    236, 'performance', true, true, true
  ),
  (
    'eml_freemind', 'sys_nia', 'youtube',
    'https://www.youtube.com/watch?v=tQiNQL-FEgU', 'tQiNQL-FEgU',
    'Free Mind',
    'https://i.ytimg.com/vi/tQiNQL-FEgU/hqdefault.jpg',
    'Tems', 'UCXg6YtKpgC59gRKUfxQw8Fw',
    'Official audio on YouTube.',
    248, 'latest', true, false, true
  )
on conflict (id) do nothing;

insert into youtube_connections (artist_id, channel_id, channel_url, channel_name, subscriber_count)
values
  ('sys_ama', 'UCKfrbVDBEq-wcYC4rUzEosA', 'https://www.youtube.com/channel/UCKfrbVDBEq-wcYC4rUzEosA', 'Black Sherif Music', 2400000),
  ('sys_nia', 'UCEzDdNqNkT-7rSfSGSr1hWg', 'https://www.youtube.com/channel/UCEzDdNqNkT-7rSfSGSr1hWg', 'Burna Boy', 8900000),
  ('sys_wave', 'UCDfH7E8iHkEjmZ6H9uQ5o1g', 'https://www.youtube.com/channel/UCDfH7E8iHkEjmZ6H9uQ5o1g', 'Uncle Waffles', 410000),
  ('sys_lila', 'UCDfH7E8iHkEjmZ6H9uQ5o1g', 'https://www.youtube.com/channel/UCDfH7E8iHkEjmZ6H9uQ5o1g', 'Uncle Waffles', 410000)
on conflict (artist_id) do nothing;

insert into promotion_campaigns (
  id, creator_id, content_type, external_music_link_id, campaign_name, description, status,
  budget_cents, daily_budget_cents, spent_cents, currency, start_date, end_date,
  target_countries, target_genres, target_audience, featured
) values
  (
    'camp_kwaku', 'sys_ama', 'youtube', 'eml_kwaku',
    'Kwaku nights',
    'Send new listeners to the official video.',
    'active', 15000, 1500, 4200, 'USD', '2026-08-01', '2026-09-15',
    'US,GB,GH', 'Hip Hop', 'new listeners', true
  ),
  (
    'camp_term', 'sys_kofi', 'youtube', 'eml_terminator',
    'Terminator on VerzZify',
    'London to the official clip.',
    'active', 8000, 800, 2100, 'GBP', '2026-08-10', '2026-09-10',
    'GB', 'Hip Hop', 'fans', false
  ),
  (
    'camp_last', 'sys_nia', 'youtube', 'eml_lastlast',
    'Last Last — terrace',
    'Official Burna Boy video, promoted from Nia''s studio.',
    'active', 20000, 2000, 6800, 'USD', '2026-08-05', '2026-09-30',
    'NG,US,GB', 'Afrobeats', 'all', true
  ),
  (
    'camp_tanz', 'sys_lila', 'youtube', 'eml_tanzania',
    'Tanzania — jacaranda season',
    'Official amapiano video.',
    'active', 12000, 1000, 3500, 'ZAR', '2026-08-12', '2026-09-20',
    'ZA,US,GB', 'Amapiano', 'playlist curators', false
  ),
  (
    'camp_ware', 'sys_wave', 'youtube', 'eml_warehouseyt',
    'Warehouse 04 on YouTube',
    'The Accra Wave sending the floor to YouTube.',
    'active', 9000, 900, 1800, 'USD', '2026-08-08', '2026-09-08',
    'GH,US', 'Amapiano', 'fans', false
  ),
  (
    'camp_pending', 'sys_adwoa', 'youtube', 'eml_freemind',
    'Sunday Light clip',
    'Awaiting review.',
    'pending_review', 0, 0, 0, 'USD', '2026-08-20', '2026-09-20',
    'US', 'Gospel', 'fans', false
  )
on conflict (id) do nothing;

insert into promotion_targets (id, campaign_id, target_type, target_value) values
  ('pt_1', 'camp_kwaku', 'country', 'US'),
  ('pt_2', 'camp_kwaku', 'genre', 'Hip Hop'),
  ('pt_3', 'camp_last', 'country', 'NG'),
  ('pt_4', 'camp_last', 'genre', 'Afrobeats'),
  ('pt_5', 'camp_tanz', 'country', 'ZA'),
  ('pt_6', 'camp_tanz', 'genre', 'Amapiano'),
  ('pt_7', 'camp_term', 'country', 'GB'),
  ('pt_8', 'camp_term', 'genre', 'Hip Hop')
on conflict (id) do nothing;

insert into promotion_impressions (id, campaign_id, user_id, created_at) values
  ('imp_1', 'camp_kwaku', null, now() - interval '2 hours'),
  ('imp_2', 'camp_kwaku', null, now() - interval '1 day'),
  ('imp_3', 'camp_kwaku', null, now() - interval '3 days'),
  ('imp_4', 'camp_last', null, now() - interval '5 hours'),
  ('imp_5', 'camp_last', null, now() - interval '2 days'),
  ('imp_6', 'camp_tanz', null, now() - interval '6 hours'),
  ('imp_7', 'camp_term', null, now() - interval '8 hours'),
  ('imp_8', 'camp_ware', null, now() - interval '12 hours')
on conflict (id) do nothing;

insert into promotion_clicks (id, campaign_id, user_id, kind, created_at) values
  ('clk_1', 'camp_kwaku', null, 'play', now() - interval '90 minutes'),
  ('clk_2', 'camp_kwaku', null, 'card', now() - interval '1 day'),
  ('clk_3', 'camp_last', null, 'play', now() - interval '3 hours'),
  ('clk_4', 'camp_last', null, 'profile', now() - interval '2 days'),
  ('clk_5', 'camp_tanz', null, 'play', now() - interval '4 hours'),
  ('clk_6', 'camp_ware', null, 'share', now() - interval '10 hours')
on conflict (id) do nothing;

insert into promotion_engagement (id, campaign_id, user_id, event_name, created_at) values
  ('eng_1', 'camp_kwaku', null, 'playback_open', now() - interval '90 minutes'),
  ('eng_2', 'camp_last', null, 'playback_open', now() - interval '3 hours'),
  ('eng_3', 'camp_last', null, 'profile_visit', now() - interval '2 days'),
  ('eng_4', 'camp_tanz', null, 'playback_open', now() - interval '4 hours'),
  ('eng_5', 'camp_ware', null, 'share', now() - interval '10 hours')
on conflict (id) do nothing;
