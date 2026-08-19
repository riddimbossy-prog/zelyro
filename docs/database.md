# Database

Postgres is the system of record. Schema: `migrations/0002_sheba.sql` plus `0004_youtube_promotions.sql`. Seed: `0003_seed.sql`. Better Auth tables are in `0001_auth.sql` (do not edit).

## Money

All amounts are integer minor units. Wallet **balances are computed from `ledger_entries`**, never a single mutable column. Each purchase stores the fee snapshot that was applied.

## Roles

`profiles.role`: fan, artist, producer, organizer, admin, super_admin.

There is **no DJ account type**. A DJ registers as Fan, Artist/Creator, Producer, or Event Organizer depending on what they intend to do. Artist extras live in `artist_profiles` + `artist_verification`. Producer extras live in `producer_profiles`.

## External music & promotions

`external_music_links` is provider-generic (`youtube`, `spotify`, `apple_music`, `audiomack`, `soundcloud`, `boomplay`, `other`). YouTube is implemented first.

`youtube_connections` stores an artist's official YouTube channel (id, public URL, display name, avatar, subscriber count when the API permits it).

`promotion_campaigns` (+ targets, impressions, clicks, engagement) power Creator Studio promotions. Statuses: draft, pending_review, scheduled, active, paused, completed, rejected.

Sheba-hosted tracks and YouTube-hosted links are separate tables. Do not mix them.

## RLS (production Supabase)

Enable RLS on every table. Policies: a user reads public catalog; writes own likes/playlists/purchases; artists write own tracks and promotions; admins via service role only. The API still re-checks — RLS is defense in depth.
