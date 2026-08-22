-- Audiomack-style guest profile: banner, portrait, uploads, social graph.

update profiles set
  display_name = 'You',
  bio = 'Lisbon nights, coral mix, songs I actually own. Guest creator while accounts are off.',
  avatar_url = '/artists/you.jpg',
  banner_url = '/banners/you.jpg',
  city = 'Lisbon',
  country = 'PT',
  favorite_genres = 'Alt-Pop, Electronic'
where id = 'dev-user';

update artist_profiles set
  artist_name = 'You',
  verification_status = 'verified',
  monthly_listeners = 184200,
  biography = 'Lisbon nights, coral mix, songs I actually own. Guest creator while accounts are off.',
  genres = 'Alt-Pop, Electronic',
  socials = 'instagram youtube'
where user_id = 'dev-user';

insert into albums (id, artist_id, title, description, cover_url, release_date, album_type, price_cents, currency)
values
  ('alb_you_hour', 'dev-user', 'Glass Hour', 'A single cut for late rooms.', '/covers/glass-hour.jpg', '2026-07-22', 'single', 0, 'USD'),
  ('alb_you_wire', 'dev-user', 'Afterglow Wire', 'Wet streets, one take vocal.', '/covers/afterglow-wire.jpg', '2026-08-04', 'single', 199, 'USD')
on conflict (id) do nothing;

insert into tracks (
  id, artist_id, album_id, title, cover_url, audio_url, duration_ms, genre, language,
  distribution, price_cents, currency, producer, songwriter, copyright_owner,
  play_count, like_count, sort_order, country, status
) values
  ('trk_you_1', 'dev-user', 'alb_you_hour', 'Glass Hour', '/covers/glass-hour.jpg', '/audio/t10.mp3', 188000, 'Electropop', 'English', 'free_stream', 0, 'USD', 'You', 'You', 'You', 76257, 494, 1, 'PT', 'published'),
  ('trk_you_2', 'dev-user', 'alb_you_wire', 'Afterglow Wire', '/covers/afterglow-wire.jpg', '/audio/t12.mp3', 204000, 'Alt-Pop', 'English', 'paid_download', 199, 'USD', 'You', 'You', 'You', 41880, 338, 2, 'PT', 'published')
on conflict (id) do nothing;

insert into follows (follower_id, following_id) values
  ('dev-user', 'sys_nova'),
  ('dev-user', 'sys_hana'),
  ('dev-user', 'sys_jade'),
  ('sys_nova', 'dev-user'),
  ('sys_hana', 'dev-user'),
  ('sys_mateo', 'dev-user'),
  ('sys_kenji', 'dev-user')
on conflict do nothing;

insert into favorites (user_id, target_type, target_id) values
  ('dev-user', 'track', 'trk_16'),
  ('dev-user', 'track', 'trk_01'),
  ('dev-user', 'track', 'trk_21'),
  ('dev-user', 'track', 'trk_you_1')
on conflict do nothing;

insert into playlists (id, user_id, title, description, cover_url, is_public, is_system, kind)
values ('pl_you_late', 'dev-user', 'Late rooms', 'What I play after one in the morning.', '/covers/glass-hour.jpg', true, false, 'custom')
on conflict (id) do nothing;

insert into playlist_tracks (playlist_id, track_id, position) values
  ('pl_you_late', 'trk_you_1', 0),
  ('pl_you_late', 'trk_you_2', 1),
  ('pl_you_late', 'trk_16', 2)
on conflict do nothing;

insert into posts (id, user_id, body, image_url, track_id, like_count, created_at) values
  ('post_you_1', 'dev-user', 'Glass Hour is up. Free to stream, mine to keep.', '/covers/glass-hour.jpg', 'trk_you_1', 88, now() - interval '1 day'),
  ('post_you_2', 'dev-user', 'Afterglow Wire — paid download if you want the file.', '/covers/afterglow-wire.jpg', 'trk_you_2', 41, now() - interval '6 hours')
on conflict (id) do nothing;
