-- Guest creator used while sign-in is off (id matches Better Auth DEV_USER_ID).

insert into profiles (id, username, display_name, role, country, bio, avatar_url, banner_url, city)
values (
  'dev-user',
  'you',
  'You',
  'artist',
  'US',
  'Guest creator. Accounts come later.',
  '/favicon.svg',
  '/banners/hero.jpg',
  null
)
on conflict (id) do nothing;

insert into artist_profiles (user_id, artist_name, verification_status, biography, genres, payout_ready)
values (
  'dev-user',
  'You',
  'verified',
  'Open Studio and upload. Sign-in returns when accounts ship.',
  'Pop',
  false
)
on conflict (user_id) do nothing;

insert into wallets (user_id, currency) values ('dev-user', 'USD')
on conflict do nothing;
