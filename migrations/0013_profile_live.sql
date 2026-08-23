-- Live set + 1-1 for the guest profile (Audiomack-plus house).

insert into live_events (id, artist_id, title, poster_url, description, starts_at, price_cents, is_free, capacity, status)
values (
  'live_you_wire',
  'dev-user',
  'Afterglow Wire — VerzZify Live',
  '/banners/you.jpg',
  'Lisbon rooftop, one take, coral mix. PPV on VerzZify Live.',
  now() + interval '2 days',
  900,
  false,
  400,
  'scheduled'
)
on conflict (id) do nothing;

insert into video_call_services (artist_id, duration_min, price_cents, currency, available)
values ('dev-user', 15, 2500, 'USD', true)
on conflict (artist_id) do nothing;
