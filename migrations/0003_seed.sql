-- Catalog seed. Fictional artists. Replay-safe via ON CONFLICT.

insert into genres (id, name, slug) values
  ('g_hiphop','Hip Hop','hip-hop'),
  ('g_rnb','R&B','rnb'),
  ('g_pop','Pop','pop'),
  ('g_afrobeats','Afrobeats','afrobeats'),
  ('g_gospel','Gospel','gospel'),
  ('g_reggae','Reggae','reggae'),
  ('g_dancehall','Dancehall','dancehall'),
  ('g_amapiano','Amapiano','amapiano'),
  ('g_highlife','Highlife','highlife'),
  ('g_hiplife','Hiplife','hiplife'),
  ('g_electronic','Electronic','electronic'),
  ('g_latin','Latin','latin'),
  ('g_indie','Indie','indie'),
  ('g_fusion','Afro-fusion','afro-fusion'),
  ('g_blues','Desert Blues','desert-blues')
on conflict (id) do nothing;

insert into profiles (id, username, display_name, role, country, bio, avatar_url, banner_url, city) values
  ('sys_zelyro','zelyro','Zelyro','admin','US','The Zelyro editorial desk.','/favicon.svg','/banners/hero.jpg','New York'),
  ('sys_ama','ama-serwaa','Ama Serwaa','artist','GH','Highlife for the golden hour.','/artists/ama.jpg','/banners/accra.jpg','Accra'),
  ('sys_kofi','kofi-blade','Kofi Blade','artist','GB','UK rap from the Hackney night market.','/artists/kofi.jpg','/banners/accra.jpg','London'),
  ('sys_nia','nia-adaeze','Nia Adaeze','artist','NG','Afrobeats, rain, and rooftop marble.','/artists/nia.jpg','/banners/lagos.jpg','Lagos'),
  ('sys_sefu','sefu-diallo','Sefu Diallo','artist','SN','Guitar at the edge of the Atlantic.','/artists/sefu.jpg','/banners/accra.jpg','Dakar'),
  ('sys_wave','accra-wave','The Accra Wave','artist','GH','Amapiano warehouse nights.','/artists/accra-wave.jpg','/banners/accra.jpg','Accra'),
  ('sys_adwoa','sister-adwoa','Sister Adwoa','artist','US','Gospel that sounds like morning light.','/artists/adwoa.jpg','/banners/chapel.jpg','Atlanta'),
  ('sys_yaw','yaw-lion','Yaw Lion','artist','JM','Dancehall from the Kingston rooftop.','/artists/yaw.jpg','/banners/accra.jpg','Kingston'),
  ('sys_lila','lila-moyo','Lila Moyo','artist','ZA','Amapiano in jacaranda season.','/artists/lila.jpg','/banners/lagos.jpg','Johannesburg'),
  ('sys_ebo','ebo-darko','Ebo Darko','producer','US','Bars and analog desks.','/artists/ebo.jpg','/banners/accra.jpg','New York'),
  ('sys_zainab','zainab-keita','Zainab Keita','artist','ML','Desert blues, dawn dust.','/artists/zainab.jpg','/banners/chapel.jpg','Bamako')
on conflict (id) do nothing;

insert into artist_profiles (user_id, artist_name, legal_name, verification_status, monthly_listeners, biography, genres, payout_ready) values
  ('sys_ama','Ama Serwaa','Ama Serwaa Mensah','verified',842000,'Ama writes highlife the way Accra remembers itself — brass, patience, and a voice that does not hurry.','Highlife',true),
  ('sys_kofi','Kofi Blade','Kofi Owusu','verified',510000,'Hackney night-market rap. Tight drums, punchlines, neon on wet tar.','Hip Hop',true),
  ('sys_nia','Nia Adaeze','Nia Adaeze Okonkwo','verified',1200000,'Lagos after rain. Afrobeats that sit between club and confession.','Afrobeats',true),
  ('sys_sefu','Sefu Diallo','Sefu Diallo','pending',188000,'Wolof guitar lines against the Atlantic wind.','Afro-fusion',false),
  ('sys_wave','The Accra Wave','Accra Wave Collective','verified',390000,'Three selectors, one warehouse, copper light until dawn.','Amapiano',true),
  ('sys_adwoa','Sister Adwoa','Adwoa Nyarko','verified',276000,'Gospel from Atlanta — linen, stained glass, unshaken hope.','Gospel',true),
  ('sys_yaw','Yaw Lion','Yaw Boateng','unverified',154000,'Dancehall from Kingston. Rooftop fire, no apology.','Dancehall',false),
  ('sys_lila','Lila Moyo','Lila Moyo','verified',670000,'Johannesburg amapiano with a quiet centre.','Amapiano',true),
  ('sys_ebo','Ebo Darko','Ebo Darko','pending',98000,'Producer, writer, occasional verse. The Brooklyn desk is the instrument.','Hip Hop',false),
  ('sys_zainab','Zainab Keita','Zainab Keita','verified',221000,'A single guitar and the first light over Bamako.','Desert Blues',true)
on conflict (user_id) do nothing;

insert into albums (id, artist_id, title, description, cover_url, release_date, album_type, price_cents, currency) values
  ('alb_gold','sys_ama','Gold Coast Evening','Two highlife studies for Accra at dusk.','/covers/gold-coast.jpg','2026-03-12','album',2500,'GHS'),
  ('alb_terrace','sys_nia','Terrace Lights','Afrobeats from a wet Lagos terrace.','/covers/terrace-lights.jpg','2026-05-02','ep',1800,'NGN'),
  ('alb_ware','sys_wave','Warehouse 04','Amapiano recorded live off the CDJs.','/covers/warehouse.jpg','2026-04-18','album',2000,'GHS'),
  ('alb_night','sys_kofi','Night Market','A London single cycle.','/covers/night-market.jpg','2026-06-01','single',399,'GBP'),
  ('alb_atl','sys_sefu','Atlantic Wind','Guitar and salt air.','/covers/atlantic-wind.jpg','2026-02-20','single',0,'USD'),
  ('alb_mercy','sys_adwoa','Morning Mercy','A Sunday that lasts all week.','/covers/morning-mercy.jpg','2026-01-11','single',0,'USD'),
  ('alb_roof','sys_yaw','Rooftop Fire','Dancehall, no water.','/covers/rooftop-fire.jpg','2026-07-08','single',399,'USD'),
  ('alb_jac','sys_lila','Jacaranda','Amapiano in bloom.','/covers/jacaranda.jpg','2026-03-30','single',900,'ZAR'),
  ('alb_desk','sys_ebo','Desk Light','Late sessions, analog board.','/covers/desk-light.jpg','2026-05-22','single',299,'USD'),
  ('alb_dawn','sys_zainab','Dawn Dust','First light, one guitar.','/covers/dawn-dust.jpg','2026-04-04','single',0,'USD')
on conflict (id) do nothing;

insert into tracks (
  id, artist_id, album_id, title, cover_url, audio_url, duration_ms, genre, language,
  distribution, price_cents, currency, copyright_owner, producer, songwriter, play_count, like_count, sort_order, country, status
) values
  ('trk_01','sys_ama','alb_gold','Gold Coast Evening','/covers/gold-coast.jpg','/audio/t01.mp3',75000,'Highlife','Twi','paid_download',800,'GHS','Ama Serwaa','Kwame Boat','Ama Serwaa',184200,4120,1,'GH','published'),
  ('trk_02','sys_ama','alb_gold','Brass at Dusk','/covers/gold-coast.jpg','/audio/t02.mp3',75000,'Highlife','Twi','free_stream',0,'GHS','Ama Serwaa','Kwame Boat','Ama Serwaa',121400,2880,2,'GH','published'),
  ('trk_03','sys_kofi','alb_night','Night Market','/covers/night-market.jpg','/audio/t03.mp3',75000,'Hip Hop','English','paid_download',399,'GBP','Kofi Blade','Ebo Darko','Kofi Blade',98000,2104,1,'GB','published'),
  ('trk_04','sys_nia','alb_terrace','Rain on Marble','/covers/terrace-lights.jpg','/audio/t04.mp3',75000,'Afrobeats','English','premium',1200,'NGN','Nia Adaeze','Nia Adaeze','Nia Adaeze',402100,8900,1,'NG','published'),
  ('trk_05','sys_nia','alb_terrace','Terrace','/covers/terrace-lights.jpg','/audio/t05.mp3',75000,'Afrobeats','English','free_stream',0,'NGN','Nia Adaeze','Nia Adaeze','Nia Adaeze',255000,5400,2,'NG','published'),
  ('trk_06','sys_sefu','alb_atl','Atlantic Wind','/covers/atlantic-wind.jpg','/audio/t06.mp3',75000,'Afro-fusion','Wolof','free_download',0,'USD','Sefu Diallo','Sefu Diallo','Sefu Diallo',64000,1802,1,'SN','published'),
  ('trk_07','sys_wave','alb_ware','Warehouse 04','/covers/warehouse.jpg','/audio/t07.mp3',75000,'Amapiano','English','paid_download',700,'GHS','The Accra Wave','The Accra Wave','The Accra Wave',173000,3301,1,'GH','published'),
  ('trk_08','sys_adwoa','alb_mercy','Morning Mercy','/covers/morning-mercy.jpg','/audio/t08.mp3',75000,'Gospel','English','free_download',0,'USD','Sister Adwoa','Sister Adwoa','Sister Adwoa',91000,2700,1,'US','published'),
  ('trk_09','sys_yaw','alb_roof','Rooftop Fire','/covers/rooftop-fire.jpg','/audio/t09.mp3',75000,'Dancehall','English','paid_download',399,'USD','Yaw Lion','Ebo Darko','Yaw Lion',77000,1540,1,'JM','published'),
  ('trk_10','sys_lila','alb_jac','Jacaranda','/covers/jacaranda.jpg','/audio/t10.mp3',75000,'Amapiano','English','paid_download',900,'ZAR','Lila Moyo','Lila Moyo','Lila Moyo',210400,4980,1,'ZA','published'),
  ('trk_11','sys_ebo','alb_desk','Desk Light','/covers/desk-light.jpg','/audio/t11.mp3',75000,'Hip Hop','English','free_stream',0,'USD','Ebo Darko','Ebo Darko','Ebo Darko',45000,980,1,'US','published'),
  ('trk_12','sys_zainab','alb_dawn','Dawn Dust','/covers/dawn-dust.jpg','/audio/t12.mp3',75000,'Desert Blues','Bambara','free_download',0,'USD','Zainab Keita','Zainab Keita','Zainab Keita',88000,2400,1,'ML','published')
on conflict (id) do nothing;

insert into playlists (id, user_id, title, description, cover_url, is_public, is_system, kind) values
  ('pl_ghana','sys_zelyro','Global Charts','What the catalog is holding this week.','/covers/gold-coast.jpg',true,true,'editorial'),
  ('pl_afro','sys_zelyro','Afrobeats Now','Current pulse.','/covers/terrace-lights.jpg',true,true,'editorial'),
  ('pl_sunday','sys_zelyro','Sunday Light','Gospel and quiet morning records.','/covers/morning-mercy.jpg',true,true,'editorial'),
  ('pl_piano','sys_zelyro','After Dark','Warehouse to balcony.','/covers/warehouse.jpg',true,true,'editorial'),
  ('pl_free','sys_zelyro','Free Downloads','Creator-authorized free files.','/covers/atlantic-wind.jpg',true,true,'editorial'),
  ('pl_hip','sys_zelyro','Hip Hop Desk','Late rooms, analog boards, city nights.','/covers/desk-light.jpg',true,true,'editorial')
on conflict (id) do nothing;

insert into playlist_tracks (playlist_id, track_id, position) values
  ('pl_ghana','trk_01',1),('pl_ghana','trk_04',2),('pl_ghana','trk_03',3),('pl_ghana','trk_07',4),('pl_ghana','trk_10',5),('pl_ghana','trk_11',6),
  ('pl_afro','trk_04',1),('pl_afro','trk_05',2),('pl_afro','trk_10',3),('pl_afro','trk_07',4),
  ('pl_sunday','trk_08',1),('pl_sunday','trk_12',2),('pl_sunday','trk_02',3),
  ('pl_piano','trk_07',1),('pl_piano','trk_10',2),('pl_piano','trk_05',3),
  ('pl_free','trk_06',1),('pl_free','trk_08',2),('pl_free','trk_12',3),
  ('pl_hip','trk_11',1),('pl_hip','trk_03',2),('pl_hip','trk_09',3)
on conflict do nothing;

insert into events (id, organizer_id, title, poster_url, venue, city, country, starts_at, description, status) values
  ('evt_labadi','sys_ama','Labadi Highlife Night','/events/labadi.jpg','Labadi Beach','Accra','GH','2026-09-12 19:00:00+00','Sunset brass, sand, and the Gold Coast catalog live.','published'),
  ('evt_ware','sys_wave','Warehouse 04 — Live','/covers/warehouse.jpg','Tema Industrial Shed 4','Accra','GH','2026-08-29 22:00:00+00','Amapiano until the copper lights fail.','published'),
  ('evt_east','sys_ebo','East River Session','/covers/desk-light.jpg','Bushwick Room','New York','US','2026-09-05 21:00:00+00','Analog desk, late verses, East River after midnight.','published'),
  ('evt_hackney','sys_kofi','Hackney Night Market','/covers/night-market.jpg','Netil Market','London','GB','2026-09-18 20:00:00+00','UK rap under the railway lights.','published')
on conflict (id) do nothing;

insert into event_ticket_types (id, event_id, name, price_cents, currency, capacity, sold) values
  ('tt_lab_std','evt_labadi','Standard',8000,'GHS',800,214),
  ('tt_lab_vip','evt_labadi','VIP',20000,'GHS',120,41),
  ('tt_ware_std','evt_ware','Standard',6000,'GHS',400,188),
  ('tt_east_std','evt_east','Standard',3500,'USD',300,92),
  ('tt_hack_std','evt_hackney','Standard',1800,'GBP',250,67)
on conflict (id) do nothing;

insert into live_events (id, artist_id, title, poster_url, description, starts_at, price_cents, is_free, capacity, status) values
  ('live_nia','sys_nia','Terrace Lights — Zelyro Live','/events/rooftop.jpg','An intimate Lagos rooftop set. PPV access, server-validated.','2026-08-22 20:00:00+00',2500,false,500,'scheduled'),
  ('live_adwoa','sys_adwoa','Morning Mercy — Chapel Session','/covers/morning-mercy.jpg','A free Sunday livestream from Atlanta.','2026-08-23 09:00:00+00',0,true,null,'scheduled')
on conflict (id) do nothing;

insert into video_call_services (artist_id, duration_min, price_cents, currency, available) values
  ('sys_ama',15,15000,'GHS',true),
  ('sys_nia',10,22000,'NGN',true),
  ('sys_kofi',15,2500,'GBP',true)
on conflict (artist_id) do nothing;

insert into posts (id, user_id, body, image_url, track_id, like_count, created_at) values
  ('post_1','sys_ama','Gold Coast Evening is out. Brass, dusk, and the city below. Thank you for sitting with this one.','/covers/gold-coast.jpg','trk_01',842, now() - interval '2 days'),
  ('post_2','sys_nia','Rooftop session this week on Zelyro Live. Bring a quiet evening.','/events/rooftop.jpg','trk_04',1204, now() - interval '1 day'),
  ('post_3','sys_wave','Warehouse 04. Doors 10. No phones on the booth.','/covers/warehouse.jpg','trk_07',511, now() - interval '18 hours'),
  ('post_4','sys_adwoa','If you need a Sunday that does not rush you, Morning Mercy is free to keep.','/covers/morning-mercy.jpg','trk_08',390, now() - interval '3 days'),
  ('post_5','sys_kofi','Night market never closed. New single in the library.','/covers/night-market.jpg','trk_03',276, now() - interval '8 hours'),
  ('post_6','sys_zainab','Recorded at first light. The guitar stayed in one take.','/covers/dawn-dust.jpg','trk_12',188, now() - interval '5 days')
on conflict (id) do nothing;

insert into comments (id, user_id, target_type, target_id, body) values
  ('c_1','sys_kofi','track','trk_01','The brass line at 0:40 is unfair.'),
  ('c_2','sys_ebo','track','trk_04','Mix is clean. Vocal sits right.')
on conflict (id) do nothing;

insert into articles (id, title, slug, category, excerpt, body, cover_url) values
  ('art_1','Highlife does not need to shout','highlife-does-not-shout','Music','Ama Serwaa and the quiet return of Accra brass.','Zelyro is not a copy of anyone’s catalog. The Gold Coast Evening sessions were tracked at dusk so the horns would have to compete with the city, not a click.','/covers/gold-coast.jpg'),
  ('art_2','How artists keep the file','how-artists-keep-the-file','Artists','Why Zelyro sells downloads without selling the copyright.','A purchase on Zelyro is a license the artist wrote. Basic keeps the file in your account. Premium, when the artist allows it, is an authorized download with a receipt. Copyright does not move.','/covers/desk-light.jpg')
on conflict (id) do nothing;

insert into commission_rules (id, product_type, platform_bps, processor_bps, min_payout_cents, currency) values
  ('fee_track','track',1500,300,5000,'USD'),
  ('fee_ticket','ticket',1000,300,5000,'USD'),
  ('fee_live','live',1200,300,5000,'USD'),
  ('fee_call','video_call',1500,300,5000,'USD')
on conflict (id) do nothing;

insert into subscription_plans (id, name, price_cents, currency, interval, features) values
  ('plan_free','Zelyro Free',0,'USD','month','Standard streaming, discovery, community'),
  ('plan_plus','Zelyro Plus',999,'USD','month','Ad-free Zelyro-hosted audio, extra downloads, early live access')
on conflict (id) do nothing;

insert into feature_flags (key, enabled, payload) values
  ('ENABLE_YOUTUBE',true,null),
  ('ENABLE_TICKETING',true,null),
  ('ENABLE_ZELYRO_LIVE',true,null),
  ('ENABLE_VIDEO_CALLS',true,null),
  ('ENABLE_PREMIUM',true,null),
  ('ENABLE_NEARBY_ARTISTS',true,null)
on conflict (key) do nothing;

insert into remote_config (key, value) values
  ('default_currency','USD'),
  ('supported_currencies','USD,GBP,EUR,GHS,NGN,ZAR'),
  ('min_payout_cents','5000'),
  ('maintenance_mode','false')
on conflict (key) do nothing;

insert into wallets (user_id, currency) values
  ('sys_ama','GHS'),('sys_kofi','GBP'),('sys_nia','NGN'),('sys_sefu','USD'),
  ('sys_wave','GHS'),('sys_adwoa','USD'),('sys_yaw','USD'),('sys_lila','ZAR'),
  ('sys_ebo','USD'),('sys_zainab','USD')
on conflict (user_id) do nothing;

insert into ledger_entries (id, wallet_user_id, amount_cents, direction, kind, ref_type, available, meta) values
  ('led_ama_1','sys_ama',184200,'credit','sale','track',true,'{"note":"lifetime seed"}'),
  ('led_ama_2','sys_ama',42000,'credit','sale','ticket',false,'{"note":"pending settlement"}'),
  ('led_nia_1','sys_nia',512000,'credit','sale','track',true,'{"note":"lifetime seed"}'),
  ('led_wave_1','sys_wave',91000,'credit','sale','ticket',true,'{"note":"lifetime seed"}')
on conflict (id) do nothing;
