# VerzZify — System Architecture (Phase 1)

VerzZify is a creator-first music platform: streaming + direct sales + wallets + events + live + community. This document is the foundation. Do not skip it.

## 1. Architecture diagram

```
Flutter (iOS / Android / Web / desktop / foldables)
        │
        ▼
Cloudflare  — DNS, TLS, CDN, WAF, bot, rate-limit, image resize
        │
        ▼
DigitalOcean  NestJS  /api/v1
        ├── Supabase Postgres + RLS (Better Auth sessions)
        ├── AWS S3          (masters, stream renders, art)
        ├── YouTube Data API (search, metadata; official player only)
        ├── Jamendo API        (independents: stream + optional download)
        ├── YouTube promotions (campaigns, VerzZify-side analytics)
        ├── Firebase Cloud Messaging
        ├── Payment adapters (MoMo, cards, Apple/Google Pay)
        └── Workers         (FFmpeg, waveform, trending, mail)
```

**Rule:** Flutter never holds S3, payment, or service-role secrets. The API is the only privileged actor.

This workspace ships a **web executable slice** of the same product (TanStack Start + Postgres) so discovery, player, studio, and geo home can be tried immediately. It is **not** the store client. The store client is [`apps/flutter`](../apps/flutter).

## Launch order

1. **Flutter Web MVP** — one Flutter project: home (IP country + nearby), VerzZify player, catalog, studio lite. YouTube stays Data API + official player only.
2. **Test with real artists and listeners** — playback, geo feed, follow, promote-a-track.
3. **Complete native playback, downloads, notifications, billing** — `<audio>`/just_audio for VerzZify masters, FCM, wallets, store billing. No YouTube offline.
4. **Compile the same Flutter project for Android and iOS** — no second UI rewrite.
5. **Submit native-quality builds** to Play and App Store.

Do not ship this TanStack preview to the stores. Do not split into a separate native app until step 4.

## 2. GitHub structure

```
verzzify/
  apps/flutter
  apps/api            # NestJS
  apps/admin
  packages/shared-types
  packages/configuration
  infrastructure/{supabase,cloudflare,digitalocean,github}
  docs/
  .github/workflows/
```

Branches: `main`, `development`, `feature/*`. PR required. Tags `vX.Y.Z` cut production.

## 3. Database ERD (core)

`profiles 1—1 artist_profiles 1—N tracks N—1 albums`  
`users 1—N playlists 1—N playlist_tracks`  
`users 1—N purchases 1—N purchase_items / licenses`  
`wallets 1—N ledger_entries` (immutable)  
`events 1—N ticket_types 1—N tickets 1—N scans`  
`live_events 1—N live_entitlements`  
`posts / comments / follows / favorites / notifications / reports`  
`external_music_links / youtube_connections / promotion_campaigns`

Roles: fan, artist, producer, organizer, admin, super_admin. **No DJ role.**

See `migrations/0002_core.sql`. Money is integer minor units. Fee snapshots are stored per purchase.

## 4. AWS S3

| Bucket | Access |
| --- | --- |
| verzzify-masters | private, artist/admin |
| verzzify-stream | private, signed, entitlement |
| verzzify-public | CDN, covers/banners |

Upload = `requestUpload` then presigned PUT (AWS) or `/api/storage/upload` (preview). Download = `/api/storage/media/:id` after the object is marked ready. Masters never stream. `npm run infra:provision` creates the buckets when AWS keys exist.


## 5. DigitalOcean API

NestJS modules listed in `/architecture`. Pattern: Controller → Service → Repository. Versioned `/api/v1`. Standardized errors `{ success, code, message }`. Structured logs, no secrets.

## 6. Cloudflare

Edge TLS, cache public art, WAF, rate-limit auth/checkout, image variants. Not a second master store.

## 7. Firebase

FCM only (+ optional Crashlytics). Topics `artist:{id}`, `live:{id}`. Preferences live in Postgres.

## 8. YouTube

`YouTubeService` against the official Data API. `YouTubePromotionService` for campaigns. UI must visually separate VerzZify vs YouTube. No extraction, no rips, no DRM bypass. VerzZify clicks are not YouTube views.

## 9. Environment (never commit values)

Server: `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AWS_*`, `YOUTUBE_API_KEY`, `FCM_*`, `PAYMENT_WEBHOOK_SECRET`, `BETTER_AUTH_SECRET`.  
Client: `VITE_API_BASE`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## 10. CI/CD

GitHub Actions: install, format, analyze, test, build, deploy staging from `development`, production from tags.

## 11. Security

Never trust client user id, price, commission, or purchase status. RLS + API auth. Append-only ledger. Signed webhooks. Audit log.

## 12. Build order

1. Repo / docs / env / CI  
2. Schema + RLS + seed  
3. Auth  
4. Design system + nav + player  
5. Profiles  
6. Catalog / search / stream  
7. Upload worker + S3  
8. Checkout / ledger / payouts  
9. Discovery / YouTube / trending  
10. Community / events / live / admin  

## Infrastructure ownership checklist

Domain registrar · DNS · Cloudflare · GitHub org · repos · Supabase · Firebase · AWS + S3 · DigitalOcean · Google Cloud (YouTube) · Apple Developer · Play Console · payment providers · email · livestream · analytics · monitoring.

Owners hold master accounts. Developers get delegated access.
