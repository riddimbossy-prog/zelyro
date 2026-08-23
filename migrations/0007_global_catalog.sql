-- Global roster. Fictional artists. Replay-safe.

insert into genres (id, name, slug) values
  ('g_citypop','City Pop','city-pop'),
  ('g_electropop','Electropop','electropop'),
  ('g_techno','Techno','techno'),
  ('g_indiepop','Indie Pop','indie-pop')
on conflict (id) do nothing;

insert into profiles (id, username, display_name, role, country, bio, avatar_url, banner_url, city) values
  ('sys_hana','hana-mori','Hana Mori','artist','JP','City pop after midnight in Shibuya rain.','/artists/hana.jpg','/banners/tokyo.jpg','Tokyo'),
  ('sys_mateo','mateo-ruiz','Mateo Ruiz','artist','MX','Latin from a Mexico City rooftop.','/artists/mateo.jpg','/covers/rooftop-chair.jpg','Mexico City'),
  ('sys_nova','nova-park','Nova Park','artist','KR','Seoul electropop, chrome and rain.','/artists/nova.jpg','/banners/seoul.jpg','Seoul'),
  ('sys_priya','priya-sen','Priya Sen','artist','IN','Indie pop through a Mumbai monsoon window.','/artists/priya.jpg','/covers/monsoon-window.jpg','Mumbai'),
  ('sys_luca','luca-voss','Luca Voss','artist','DE','Berlin techno. Concrete, one strobe.','/artists/luca.jpg','/covers/berlin-strobe.jpg','Berlin'),
  ('sys_amira','amira-haddad','Amira Haddad','artist','LB','Beirut dusk, linen, a quiet voice.','/artists/amira.jpg','/covers/beirut-dusk.jpg','Beirut'),
  ('sys_jade','jade-rivera','Jade Rivera','artist','US','Los Angeles R&B at the last light.','/artists/jade.jpg','/covers/palm-shadow.jpg','Los Angeles'),
  ('sys_kenji','kenji-sato','Kenji Sato','producer','JP','Osaka electronics, analog and alley neon.','/artists/kenji.jpg','/covers/osaka-alley.jpg','Osaka')
on conflict (id) do nothing;

insert into artist_profiles (user_id, artist_name, legal_name, verification_status, monthly_listeners, biography, genres, payout_ready) values
  ('sys_hana','Hana Mori','Hana Mori','verified',910000,'Tokyo city pop with patience — neon on wet tar, no hurry in the chorus.','City Pop',true),
  ('sys_mateo','Mateo Ruiz','Mateo Ruiz Herrera','verified',640000,'Rooftop latin from CDMX. Guitar, dust, and a crowd that sings the second verse.','Latin',true),
  ('sys_nova','Nova Park','Park Soo-min','verified',1100000,'Seoul electropop. Tight drums, chrome synths, a voice that does not blink.','Electropop',true),
  ('sys_priya','Priya Sen','Priya Sen','verified',430000,'Mumbai indie pop. Rain on the glass, a lamp left on, the city still awake.','Indie Pop',true),
  ('sys_luca','Luca Voss','Luca Voss','verified',520000,'Berlin techno. One room, one strobe, no vocals until they earn it.','Techno',true),
  ('sys_amira','Amira Haddad','Amira Haddad','verified',310000,'Beirut indie. Arabic and English in the same breath, balcony dusk.','Indie',true),
  ('sys_jade','Jade Rivera','Jade Rivera','verified',780000,'Los Angeles R&B. Palm shadows, late sun, a hook that stays.','R&B',true),
  ('sys_kenji','Kenji Sato','Kenji Sato','pending',145000,'Osaka producer. Vending-machine neon, analog desks, no wasted hits.','Electronic',false)
on conflict (user_id) do nothing;

insert into albums (id, artist_id, title, description, cover_url, release_date, album_type, price_cents, currency) values
  ('alb_cross','sys_hana','Midnight Crossing','City pop for the last train.','/covers/midnight-crossing.jpg','2026-06-14','single',499,'USD'),
  ('alb_chair','sys_mateo','Empty Chair','Latin from a CDMX roof.','/covers/rooftop-chair.jpg','2026-05-28','single',399,'USD'),
  ('alb_glass','sys_nova','Glass Rain','Electropop through Seoul glass.','/covers/seoul-glass.jpg','2026-07-01','ep',799,'USD'),
  ('alb_monsoon','sys_priya','Monsoon Window','Indie pop, rain left on.','/covers/monsoon-window.jpg','2026-04-22','single',0,'USD'),
  ('alb_strobe','sys_luca','One Strobe','A Berlin floor, nothing extra.','/covers/berlin-strobe.jpg','2026-03-09','single',499,'EUR'),
  ('alb_dusk','sys_amira','Balcony Dusk','Beirut evening, two languages.','/covers/beirut-dusk.jpg','2026-02-14','single',0,'USD'),
  ('alb_palm','sys_jade','Palm Shadow','R&B at the last Los Angeles light.','/covers/palm-shadow.jpg','2026-06-20','single',399,'USD'),
  ('alb_alley','sys_kenji','Alley Neon','Instrumentals from Osaka night.','/covers/osaka-alley.jpg','2026-05-11','single',299,'USD')
on conflict (id) do nothing;

insert into tracks (
  id, artist_id, album_id, title, cover_url, audio_url, duration_ms, genre, language,
  distribution, price_cents, currency, copyright_owner, producer, songwriter, play_count, like_count, sort_order, country, status
) values
  ('trk_13','sys_hana','alb_cross','Midnight Crossing','/covers/midnight-crossing.jpg','/audio/t01.mp3',75000,'City Pop','Japanese','paid_download',499,'USD','Hana Mori','Kenji Sato','Hana Mori',268000,6400,1,'JP','published'),
  ('trk_14','sys_hana','alb_cross','Last Train','/covers/midnight-crossing.jpg','/audio/t02.mp3',75000,'City Pop','Japanese','free_stream',0,'USD','Hana Mori','Kenji Sato','Hana Mori',141000,3200,2,'JP','published'),
  ('trk_15','sys_mateo','alb_chair','Empty Chair','/covers/rooftop-chair.jpg','/audio/t03.mp3',75000,'Latin','Spanish','paid_download',399,'USD','Mateo Ruiz','Mateo Ruiz','Mateo Ruiz',198000,4100,1,'MX','published'),
  ('trk_16','sys_nova','alb_glass','Glass Rain','/covers/seoul-glass.jpg','/audio/t04.mp3',75000,'Electropop','Korean','premium',799,'USD','Nova Park','Nova Park','Nova Park',388000,9100,1,'KR','published'),
  ('trk_17','sys_nova','alb_glass','Chrome','/covers/seoul-glass.jpg','/audio/t05.mp3',75000,'Electropop','Korean','free_stream',0,'USD','Nova Park','Nova Park','Nova Park',221000,5400,2,'KR','published'),
  ('trk_18','sys_priya','alb_monsoon','Monsoon Window','/covers/monsoon-window.jpg','/audio/t06.mp3',75000,'Indie Pop','English','free_download',0,'USD','Priya Sen','Priya Sen','Priya Sen',112000,2800,1,'IN','published'),
  ('trk_19','sys_luca','alb_strobe','One Strobe','/covers/berlin-strobe.jpg','/audio/t07.mp3',75000,'Techno','Instrumental','paid_download',499,'EUR','Luca Voss','Luca Voss','Luca Voss',156000,2900,1,'DE','published'),
  ('trk_20','sys_amira','alb_dusk','Balcony Dusk','/covers/beirut-dusk.jpg','/audio/t08.mp3',75000,'Indie','Arabic','free_download',0,'USD','Amira Haddad','Amira Haddad','Amira Haddad',94000,2100,1,'LB','published'),
  ('trk_21','sys_jade','alb_palm','Palm Shadow','/covers/palm-shadow.jpg','/audio/t09.mp3',75000,'R&B','English','paid_download',399,'USD','Jade Rivera','Ebo Darko','Jade Rivera',274000,6700,1,'US','published'),
  ('trk_22','sys_kenji','alb_alley','Alley Neon','/covers/osaka-alley.jpg','/audio/t10.mp3',75000,'Electronic','Instrumental','free_stream',0,'USD','Kenji Sato','Kenji Sato','Kenji Sato',67000,1400,1,'JP','published')
on conflict (id) do nothing;

insert into playlists (id, user_id, title, description, cover_url, is_public, is_system, kind) values
  ('pl_latin','sys_zelyro','Latin Now','Rooftops, second verses, no translation needed.','/covers/rooftop-chair.jpg',true,true,'editorial'),
  ('pl_city','sys_zelyro','City Pop After Dark','Tokyo midnight, last trains.','/covers/midnight-crossing.jpg',true,true,'editorial'),
  ('pl_electro','sys_zelyro','Electronic','Seoul chrome to Berlin concrete.','/covers/berlin-strobe.jpg',true,true,'editorial'),
  ('pl_pop','sys_zelyro','Pop Worldwide','Hooks from more than one city.','/covers/seoul-glass.jpg',true,true,'editorial')
on conflict (id) do nothing;

insert into playlist_tracks (playlist_id, track_id, position) values
  ('pl_ghana','trk_16',7),('pl_ghana','trk_13',8),('pl_ghana','trk_21',9),('pl_ghana','trk_15',10),
  ('pl_latin','trk_15',1),
  ('pl_city','trk_13',1),('pl_city','trk_14',2),
  ('pl_electro','trk_16',1),('pl_electro','trk_17',2),('pl_electro','trk_19',3),('pl_electro','trk_22',4),
  ('pl_pop','trk_16',1),('pl_pop','trk_21',2),('pl_pop','trk_13',3),('pl_pop','trk_18',4),
  ('pl_free','trk_18',4),('pl_free','trk_20',5),
  ('pl_hip','trk_21',4)
on conflict do nothing;

insert into events (id, organizer_id, title, poster_url, venue, city, country, starts_at, description, status) values
  ('evt_shibuya','sys_hana','Midnight Crossing — Live','/covers/midnight-crossing.jpg','Circle Line Hall','Tokyo','JP','2026-09-20 19:30:00+00','City pop, last-train encore.','published'),
  ('evt_roma','sys_mateo','Rooftop Session CDMX','/covers/rooftop-chair.jpg','Roma Norte Roof','Mexico City','MX','2026-09-08 20:00:00+00','Latin, dust, and the second verse.','published'),
  ('evt_han','sys_nova','Glass Rain','/covers/seoul-glass.jpg','Han River Warehouse','Seoul','KR','2026-09-26 21:00:00+00','Electropop under rain glass.','published'),
  ('evt_kraft','sys_luca','One Strobe','/covers/berlin-strobe.jpg','Kraftwerk Room','Berlin','DE','2026-09-14 23:00:00+00','Techno until the strobe fails.','published'),
  ('evt_echo','sys_jade','Palm Shadow Night','/covers/palm-shadow.jpg','Echo Park Loft','Los Angeles','US','2026-09-11 21:00:00+00','R&B at the last light.','published')
on conflict (id) do nothing;

insert into event_ticket_types (id, event_id, name, price_cents, currency, capacity, sold) values
  ('tt_shi_std','evt_shibuya','Standard',4500,'USD',400,156),
  ('tt_roma_std','evt_roma','Standard',1800,'USD',220,88),
  ('tt_han_std','evt_han','Standard',3800,'USD',500,241),
  ('tt_kft_std','evt_kraft','Standard',2200,'EUR',300,190),
  ('tt_echo_std','evt_echo','Standard',2500,'USD',180,71)
on conflict (id) do nothing;

insert into live_events (id, artist_id, title, poster_url, description, starts_at, price_cents, is_free, capacity, status) values
  ('live_nova','sys_nova','Glass Rain — VerzZify Live','/covers/seoul-glass.jpg','PPV from Seoul. Server-validated access.','2026-08-28 13:00:00+00',1200,false,800,'scheduled'),
  ('live_hana','sys_hana','Last Train — Tokyo','/covers/midnight-crossing.jpg','A free midnight set from Tokyo.','2026-08-30 15:00:00+00',0,true,null,'scheduled')
on conflict (id) do nothing;

insert into video_call_services (artist_id, duration_min, price_cents, currency, available) values
  ('sys_hana',15,2500,'USD',true),
  ('sys_nova',10,3000,'USD',true),
  ('sys_jade',15,2000,'USD',true),
  ('sys_mateo',15,1500,'USD',true)
on conflict (artist_id) do nothing;

insert into posts (id, user_id, body, image_url, track_id, like_count, created_at) values
  ('post_7','sys_hana','Midnight Crossing is out. If you are on the last train, this is the one.','/covers/midnight-crossing.jpg','trk_13',964, now() - interval '6 hours'),
  ('post_8','sys_nova','Glass Rain, Seoul. PPV this week on VerzZify Live.','/covers/seoul-glass.jpg','trk_16',1502, now() - interval '12 hours'),
  ('post_9','sys_mateo','Empty chair, full roof. CDMX Thursday.','/covers/rooftop-chair.jpg','trk_15',411, now() - interval '2 days'),
  ('post_10','sys_jade','Palm Shadow. Los Angeles does not owe you a sunset, but this one stayed.','/covers/palm-shadow.jpg','trk_21',733, now() - interval '4 hours')
on conflict (id) do nothing;

insert into articles (id, title, slug, category, excerpt, body, cover_url) values
  ('art_3','A catalog with more than one city','catalog-more-than-one-city','Music','Tokyo, Seoul, Mexico City, Berlin, Lagos, London — same house.','VerzZify is not a regional streaming app. The point is ownership: an artist in Seoul can sell a file, an artist in Accra can sell a ticket, an artist in Los Angeles can promote an official YouTube without the catalog confusing the two. The cities are the catalog, not the brand.','/covers/seoul-glass.jpg')
on conflict (id) do nothing;

insert into wallets (user_id, currency) values
  ('sys_hana','USD'),('sys_mateo','USD'),('sys_nova','USD'),('sys_priya','USD'),
  ('sys_luca','EUR'),('sys_amira','USD'),('sys_jade','USD'),('sys_kenji','USD')
on conflict (user_id) do nothing;

insert into ledger_entries (id, wallet_user_id, amount_cents, direction, kind, ref_type, available, meta) values
  ('led_nova_1','sys_nova',388000,'credit','sale','track',true,'{"note":"lifetime seed"}'),
  ('led_hana_1','sys_hana',142000,'credit','sale','track',true,'{"note":"lifetime seed"}'),
  ('led_jade_1','sys_jade',98000,'credit','sale','track',true,'{"note":"lifetime seed"}')
on conflict (id) do nothing;

insert into studios (id, name, city, country, kind, description) values
  ('st_shibuya', 'Shibuya Night Desk', 'Tokyo', 'JP', 'recording', 'After-hours booth, wet street below.'),
  ('st_itaewon', 'Han River Glass', 'Seoul', 'KR', 'recording', 'Tracking with city rain on the pane.'),
  ('st_roma', 'Roma Norte Roof', 'Mexico City', 'MX', 'rehearsal', 'Open air, terracotta, late light.'),
  ('st_kraft', 'Kraftwerk Room', 'Berlin', 'DE', 'rehearsal', 'Concrete, one strobe, no wasted hits.'),
  ('st_echo', 'Echo Park Loft', 'Los Angeles', 'US', 'recording', 'Palm shadow on the south wall.')
on conflict (id) do nothing;

insert into producer_profiles (user_id, display_title, beats, services, credits, location, available_for_collab, youtube_url, contact)
values (
  'sys_kenji',
  'Osaka electronics, analog and alley neon',
  'Synth beds, city-pop drums, night-market FX',
  'Beat lease, mix, soundtrack cue',
  'Hana Mori — Midnight Crossing',
  'Osaka',
  true,
  'https://youtube.com/@verzzify',
  'kenji@verzzify.com'
) on conflict (user_id) do nothing;

update remote_config set value = 'USD,GBP,EUR,JPY,KRW,MXN,INR,GHS,NGN,ZAR,BRL'
  where key = 'supported_currencies';
