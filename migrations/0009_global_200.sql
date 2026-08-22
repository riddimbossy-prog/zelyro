-- Zelyro Global 200: Billboard-style stream-equivalent units.
-- SEU = (paid downloads × 200) + streams. D2C sales on Zelyro count.

create table if not exists chart_download_units (
  track_id text primary key references tracks(id) on delete cascade,
  units integer not null default 0
);

insert into chart_download_units (track_id, units) values
  ('trk_16', 920),
  ('trk_04', 210),
  ('trk_21', 440),
  ('trk_13', 380),
  ('trk_15', 120),
  ('trk_05', 40),
  ('trk_17', 85),
  ('trk_10', 60),
  ('trk_01', 90),
  ('trk_07', 55),
  ('trk_19', 70),
  ('trk_14', 30),
  ('trk_03', 45),
  ('trk_18', 22),
  ('trk_08', 15),
  ('trk_20', 18),
  ('trk_09', 28),
  ('trk_22', 12),
  ('trk_06', 8),
  ('trk_11', 10),
  ('trk_02', 14),
  ('trk_12', 11)
on conflict (track_id) do update set units = excluded.units;

alter table chart_ranks add column if not exists peak integer;
alter table chart_ranks add column if not exists weeks_on integer;

update chart_ranks set
  peak = case item_id
    when 'trk_04' then 1 when 'trk_13' then 2 when 'trk_16' then 1 when 'trk_21' then 3
    when 'trk_05' then 3 when 'trk_10' then 5 when 'trk_01' then 4 when 'trk_07' then 6
    else position end,
  weeks_on = case item_id
    when 'trk_04' then 18 when 'trk_13' then 9 when 'trk_16' then 7 when 'trk_21' then 6
    when 'trk_05' then 16 when 'trk_10' then 14 when 'trk_01' then 22 when 'trk_07' then 11
    when 'trk_03' then 8 when 'trk_19' then 5 when 'sys_nia' then 22 when 'sys_nova' then 7
    when 'sys_hana' then 9 when 'sys_ama' then 22 else 4 end
where peak is null or weeks_on is null;

insert into chart_snapshots (id, chart_key, period, captured_at) values
  ('snap_tracks_excl_us', 'tracks:excl_us:all', 'weekly', now() - interval '7 days')
on conflict (id) do nothing;

insert into chart_ranks (snapshot_id, position, item_type, item_id, points, peak, weeks_on)
select 'snap_tracks_excl_us',
       row_number() over (order by position),
       item_type, item_id, points, peak, weeks_on
from chart_ranks
where snapshot_id = 'snap_tracks_global'
  and item_id not in ('trk_21', 'trk_08', 'trk_11')
on conflict do nothing;
