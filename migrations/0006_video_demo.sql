insert into video_chat_sessions (id, artist_id, duration_min, price_cents, currency, status, notes)
values
  ('vc_demo_ama','sys_ama',15,15000,'GHS','waiting','Waiting room — Ama'),
  ('vc_demo_nia','sys_nia',10,22000,'NGN','waiting','Waiting room — Nia')
on conflict (id) do nothing;
