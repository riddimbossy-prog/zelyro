-- Global Music Charts: weekly snapshots for movement (▲ ▼ NEW).
-- Live ranking is computed from streams + saves. Snapshots are last week.

create table if not exists chart_snapshots (
  id text primary key,
  chart_key text not null,
  period text not null default 'weekly',
  captured_at timestamptz not null default now()
);

create index if not exists chart_snapshots_key_idx on chart_snapshots (chart_key, captured_at desc);

create table if not exists chart_ranks (
  snapshot_id text not null references chart_snapshots(id) on delete cascade,
  position integer not null,
  item_type text not null,
  item_id text not null,
  points integer not null default 0,
  primary key (snapshot_id, item_type, item_id)
);

insert into chart_snapshots (id, chart_key, period, captured_at) values
  ('snap_tracks_global', 'tracks:global:all', 'weekly', now() - interval '7 days'),
  ('snap_artists_global', 'artists:global:all', 'weekly', now() - interval '7 days')
on conflict (id) do nothing;

-- Previous week: a few swaps so the live board shows rises, drops, and NEW.
insert into chart_ranks (snapshot_id, position, item_type, item_id, points) values
  ('snap_tracks_global', 1, 'track', 'trk_04', 490000),
  ('snap_tracks_global', 2, 'track', 'trk_13', 350000),
  ('snap_tracks_global', 3, 'track', 'trk_05', 310000),
  ('snap_tracks_global', 4, 'track', 'trk_16', 300000),
  ('snap_tracks_global', 5, 'track', 'trk_10', 265000),
  ('snap_tracks_global', 6, 'track', 'trk_01', 230000),
  ('snap_tracks_global', 7, 'track', 'trk_21', 210000),
  ('snap_tracks_global', 8, 'track', 'trk_07', 205000),
  ('snap_tracks_global', 9, 'track', 'trk_03', 120000),
  ('snap_tracks_global', 10, 'track', 'trk_02', 150000),
  ('snap_tracks_global', 11, 'track', 'trk_08', 118000),
  ('snap_tracks_global', 12, 'track', 'trk_19', 140000),
  ('snap_tracks_global', 13, 'track', 'trk_12', 110000),
  ('snap_tracks_global', 14, 'track', 'trk_09', 90000),
  ('snap_tracks_global', 15, 'track', 'trk_06', 82000),
  ('snap_tracks_global', 16, 'track', 'trk_11', 55000),
  ('snap_artists_global', 1, 'artist', 'sys_nia', 1200000),
  ('snap_artists_global', 2, 'artist', 'sys_hana', 900000),
  ('snap_artists_global', 3, 'artist', 'sys_ama', 840000),
  ('snap_artists_global', 4, 'artist', 'sys_nova', 700000),
  ('snap_artists_global', 5, 'artist', 'sys_lila', 670000),
  ('snap_artists_global', 6, 'artist', 'sys_kofi', 510000),
  ('snap_artists_global', 7, 'artist', 'sys_wave', 390000),
  ('snap_artists_global', 8, 'artist', 'sys_adwoa', 276000),
  ('snap_artists_global', 9, 'artist', 'sys_zainab', 221000),
  ('snap_artists_global', 10, 'artist', 'sys_sefu', 188000),
  ('snap_artists_global', 11, 'artist', 'sys_yaw', 154000),
  ('snap_artists_global', 12, 'artist', 'sys_ebo', 98000)
on conflict do nothing;
