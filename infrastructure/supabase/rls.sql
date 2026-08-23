-- Apply in the Supabase SQL editor AFTER migrations/*.sql.
-- The API uses the service role / postgres user and bypasses RLS.
-- These policies are defense in depth for the anon key: public catalog is
-- readable; writes are denied. Do not use auth.uid() — VerzZify sessions are
-- Better Auth, not Supabase Auth.

alter table tracks enable row level security;
alter table albums enable row level security;
alter table artist_profiles enable row level security;
alter table profiles enable row level security;
alter table playlists enable row level security;
alter table events enable row level security;
alter table live_events enable row level security;
alter table media_objects enable row level security;
alter table promotion_campaigns enable row level security;
alter table chart_ranks enable row level security;
alter table chart_snapshots enable row level security;
alter table chart_download_units enable row level security;

drop policy if exists tracks_public_read on tracks;
create policy tracks_public_read on tracks
  for select using (status = 'published');

drop policy if exists albums_public_read on albums;
create policy albums_public_read on albums
  for select using (visibility = 'public');

drop policy if exists artists_public_read on artist_profiles;
create policy artists_public_read on artist_profiles
  for select using (true);

drop policy if exists profiles_public_read on profiles;
create policy profiles_public_read on profiles
  for select using (true);

drop policy if exists playlists_public_read on playlists;
create policy playlists_public_read on playlists
  for select using (is_public = true);

drop policy if exists events_public_read on events;
create policy events_public_read on events
  for select using (status = 'published');

drop policy if exists live_public_read on live_events;
create policy live_public_read on live_events
  for select using (status in ('scheduled', 'live', 'ended'));

drop policy if exists media_public_read on media_objects;
create policy media_public_read on media_objects
  for select using (status = 'ready' and bucket_kind in ('public', 'stream'));

drop policy if exists charts_public_read on chart_ranks;
create policy charts_public_read on chart_ranks for select using (true);

drop policy if exists chart_snap_public_read on chart_snapshots;
create policy chart_snap_public_read on chart_snapshots for select using (true);

drop policy if exists chart_units_public_read on chart_download_units;
create policy chart_units_public_read on chart_download_units for select using (true);
