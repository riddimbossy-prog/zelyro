-- Swap leftover Zelyro copy to VerzZify on already-applied catalogs.

update live_events
set title = replace(title, 'Zelyro', 'VerzZify'),
    description = replace(coalesce(description, ''), 'Zelyro', 'VerzZify')
where title like '%Zelyro%' or coalesce(description, '') like '%Zelyro%';

update posts
set body = replace(body, 'Zelyro', 'VerzZify')
where body like '%Zelyro%';

update articles
set title = replace(title, 'Zelyro', 'VerzZify'),
    excerpt = replace(coalesce(excerpt, ''), 'Zelyro', 'VerzZify'),
    body = replace(coalesce(body, ''), 'Zelyro', 'VerzZify')
where title like '%Zelyro%'
   or coalesce(excerpt, '') like '%Zelyro%'
   or coalesce(body, '') like '%Zelyro%';

update subscription_plans
set name = replace(name, 'Zelyro', 'VerzZify'),
    features = replace(coalesce(features, ''), 'Zelyro', 'VerzZify')
where name like '%Zelyro%' or coalesce(features, '') like '%Zelyro%';

update profiles
set username = 'verzzify',
    display_name = 'VerzZify',
    bio = replace(coalesce(bio, ''), 'Zelyro', 'VerzZify')
where id = 'sys_zelyro';

update feature_flags
set key = 'ENABLE_VERZZIFY_LIVE'
where key = 'ENABLE_ZELYRO_LIVE';
