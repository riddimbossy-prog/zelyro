# Database

Postgres is the system of record. Production host is **Supabase** (`DATABASE_URL` or `SUPABASE_DB_URL` = the pooler URI). The live preview uses embedded PGLite with the same `migrations/*.sql`.

Schema: `migrations/0001_auth.sql` (Better Auth — do not edit) through `0010_storage.sql`. Seed: `0003_seed.sql` + later catalog files.

Auth is **Better Auth**, not Supabase Auth. The service role / postgres user is the API. Apply `infrastructure/supabase/rls.sql` in the Supabase SQL editor so the anon key can only read the public catalog.

## Money

All amounts are integer minor units. Wallet **balances are computed from `ledger_entries`**, never a single mutable column. Each purchase stores the fee snapshot that was applied.

## Roles

`profiles.role`: fan, artist, producer, organizer, admin, super_admin.

There is **no DJ account type**. A DJ registers as Fan, Artist/Creator, Producer, or Event Organizer depending on what they intend to do. Artist extras live in `artist_profiles` + `artist_verification`. Producer extras live in `producer_profiles`.

## External music & promotions

`external_music_links` is provider-generic (`youtube`, `spotify`, `apple_music`, `audiomack`, `soundcloud`, `boomplay`, `other`). YouTube is implemented first.

`youtube_connections` stores an artist's official YouTube channel (id, public URL, display name, avatar, subscriber count when the API permits it).

`promotion_campaigns` (+ targets, impressions, clicks, engagement) power Creator Studio promotions. Statuses: draft, pending_review, scheduled, active, paused, completed, rejected.

VerzZify-hosted tracks and YouTube-hosted links are separate tables. Do not mix them.

## Uploads

`media_objects` indexes S3 (or the preview object store). `bucket_kind` is `masters` | `stream` | `public`.

## RLS (production Supabase)

Enable RLS on every table via `infrastructure/supabase/rls.sql`. Policies: a visitor reads the public catalog; writes go through the API with a Better Auth session. Admins via service role only. The API still re-checks — RLS is defense in depth.
