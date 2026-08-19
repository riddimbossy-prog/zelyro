# Zelyro

Creator-first music platform: **streaming + direct sales + YouTube promotion + artist wallets + events + ticketing + paid livestreams + community** in one product.

This repository ships:

1. **Architecture & ops docs** — Phase 1 foundation (diagrams, ERD, S3, DigitalOcean, Cloudflare, Firebase, YouTube, env, CI/CD, security, build order).
2. **Runnable web catalog** — TanStack Start + Postgres, so the player, discovery, studio, purchases, events, and community can be used today.

Production clients (Flutter iOS / Android / Web / foldables) and the NestJS API consume the same `/api/v1` contract described in [docs/architecture.md](docs/architecture.md).

## Product

| Surface | What it does |
| --- | --- |
| Listen | Home, charts, artist pages, global player |
| Own | Paid / premium downloads with a stored license (copyright does not transfer) |
| Promote | Paste an official YouTube URL — Zelyro discovers, shares, and measures Zelyro-generated clicks |
| Support | Artist ledger, payouts, tickets, PPV livestreams |
| Community | Posts, comments, follows |

Account types: Fan, Artist/Creator, Producer, Event Organizer, Admin, Super Admin. There is no DJ account.

## Repository

```
zelyro/
  src/                 web catalog (TanStack Start)
  migrations/          Postgres schema + seed
  docs/                architecture, security, payments, streaming, …
  public/              covers, artist art, demo audio clips
  .github/workflows/   CI
```

Target production layout (Flutter + NestJS monorepo) is documented in `docs/architecture.md` §2.

## Run the web catalog

```bash
git clone https://github.com/riddimbossy-prog/zelyro.git
cd zelyro
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080). Auth is real (Google, X, email). Catalog data lives in `migrations/`. Never put secrets in the client.

```bash
npm run typecheck
npm test
npm run build
```

## Docs

| Doc | Topic |
| --- | --- |
| [architecture.md](docs/architecture.md) | Diagrams, ERD, S3, DO, Cloudflare, Firebase, YouTube, env, CI, security, build order |
| [database.md](docs/database.md) | Schema, RLS, money as integer minor units |
| [authentication.md](docs/authentication.md) | Roles, sessions, RLS |
| [streaming.md](docs/streaming.md) | Signed stream URLs, player |
| [storage.md](docs/storage.md) | S3 buckets, presigned PUT/GET |
| [payments.md](docs/payments.md) | Purchases, wallets, immutable ledger |
| [youtube.md](docs/youtube.md) | Official Data API + promotions |
| [ticketing.md](docs/ticketing.md) | Events, tickets, scans |
| [livestream.md](docs/livestream.md) | PPV live entitlements |
| [notifications.md](docs/notifications.md) | FCM topics |
| [security.md](docs/security.md) | Threat model |
| [deployment.md](docs/deployment.md) | Environments, CI/CD |
| [backups.md](docs/backups.md) / [disaster-recovery.md](docs/disaster-recovery.md) | Ops |
| [developer-onboarding.md](docs/developer-onboarding.md) | How a new team takes over |
| [api.md](docs/api.md) | `/api/v1` contract |

In-app: `/architecture`.

## Principles

Security → ownership → maintainability → creator monetization → mobile performance → UX → scale.

Never trust client user id, price, commission, or purchase status. The API is the only privileged actor.

## License

Proprietary — all rights reserved unless a license is added by the owner.
