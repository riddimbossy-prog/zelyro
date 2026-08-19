import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { copy } from "@/lib/zelyro/copy";

export const Route = createFileRoute("/architecture")({ component: Architecture });

function Architecture() {
  return (
    <main className="min-h-dvh bg-background px-6 py-10 text-foreground md:px-16">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <Link to="/" className="font-display text-2xl">
          {copy.app}
        </Link>
        <Link to="/" className="text-sm text-muted-foreground">
          Back to catalog
        </Link>
      </header>
      <article className="mx-auto mt-12 max-w-3xl space-y-14">
        <header>
          <p className="text-xs tracking-[0.25em] text-sand uppercase">Phase 1 foundation</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">System architecture</h1>
          <p className="mt-4 text-muted-foreground">
            Production target: Flutter clients, Cloudflare, DigitalOcean (NestJS), Supabase Postgres,
            AWS S3, Firebase Cloud Messaging, YouTube Data API. This running catalog is the web
            executable slice of the same product — same schema, same money rules, same player contract.
          </p>
        </header>

        <Section n="01" title="Complete architecture">
          <pre className="overflow-x-auto rounded-3xl bg-card p-5 text-xs leading-6 text-muted-foreground">{`Flutter / Web  →  Cloudflare (DNS, TLS, WAF, CDN)
                 →  DigitalOcean API  /api/v1
                      ├─ Supabase Postgres + Auth + RLS
                      ├─ AWS S3 (presigned upload / signed download)
                      ├─ YouTube Data API (search, metadata, official player)
                      ├─ YouTube promotions (campaigns, impressions, Zelyro clicks)
                      ├─ Firebase Cloud Messaging
                      ├─ Payment adapters (MoMo, cards)
                      └─ Workers (FFmpeg, waveforms, trending)`}</pre>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Flutter never talks to S3 with private keys. The API mints short-lived URLs after checking
            entitlement. Prices, commissions, and purchase status are read from the server. Row Level
            Security is a second door, not the only one.
          </p>
        </Section>

        <Section n="02" title="GitHub repository structure">
          <pre className="overflow-x-auto rounded-3xl bg-card p-5 text-xs leading-6 text-muted-foreground">{`zelyro/
  apps/flutter    apps/api (NestJS)    apps/admin
  packages/shared-types    packages/configuration
  infrastructure/supabase  cloudflare  digitalocean  github
  docs/    .github/workflows/`}</pre>
          <p className="mt-4 text-sm text-muted-foreground">
            Branches: main, development, feature/*. Secrets live in GitHub Secrets and DigitalOcean —
            never in the repo. CI runs analyze, unit tests, API tests, then staging deploy.
          </p>
        </Section>

        <Section n="03" title="Supabase schema / ERD">
          <p className="text-sm leading-relaxed text-muted-foreground">
            profiles 1—1 artist_profiles; tracks N—1 artists and N—1 albums; purchases 1—N
            purchase_items and licenses; wallets 1—N ledger_entries (immutable); events 1—N ticket
            types 1—N tickets 1—N scans; live_events 1—N entitlements;
            external_music_links (youtube first) 1—N promotion_campaigns 1—N impressions/clicks.
            Roles: fan, artist, producer, organizer, admin, super_admin — never DJ.
          </p>
        </Section>

        <Section n="04" title="AWS S3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Buckets: zelyro-masters (private), zelyro-stream (private, signed), zelyro-public (covers,
            banners). Upload: POST /api/v1/storage/sign → PUT presigned. Download: entitlement check
            then signed GET. Free / paid / premium / artist / admin policies are server-side.
          </p>
        </Section>

        <Section n="05" title="DigitalOcean backend">
          <p className="text-sm leading-relaxed text-muted-foreground">
            NestJS modules: auth, users, artists, tracks, albums, storage, streaming, youtube,
            youtube-promotions, search, recommendations, payments, wallet, payouts, subscriptions,
            tickets, events, livestream, video-calls, social, messages, notifications, analytics,
            moderation, copyright, admin.
            Controller → Service → Repository. REST at /api/v1, ready for /api/v2.
          </p>
        </Section>

        <Section n="06" title="Cloudflare">
          <p className="text-sm leading-relaxed text-muted-foreground">
            DNS + SSL, CDN for public art, WAF, bot fight, rate limit on /api/v1/auth and checkout,
            image resizing for covers. Not a second object store — S3 remains the source of masters.
          </p>
        </Section>

        <Section n="07" title="Firebase">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cloud Messaging only (plus optional Crashlytics). Topics for artist:id and live:id.
            Device tokens in Postgres. Preference categories: music, social, events, payments,
            tickets, livestreams, security. Auth remains Supabase / Better Auth — not duplicated.
          </p>
        </Section>

        <Section n="08" title="YouTube integration">
          <p className="text-sm leading-relaxed text-muted-foreground">
            YouTubeService: searchVideos, searchMusic, searchArtists, getVideoDetails, getChannelDetails,
            getRelatedVideos, getPlaylistDetails, validateYouTubeUrl, extractVideoId, getVideoThumbnail,
            getPublicVideoStats. YouTubePromotionService: create, validate, activate, pause,
            recordImpression, recordClick, recordPlaybackOpen, getCampaignAnalytics. UI labels Zelyro vs
            YouTube. Playback is the official player. No extraction, no offline rips, no DRM bypass.
            Zelyro clicks and playback opens are never reported as YouTube views.
          </p>
        </Section>

        <Section n="09" title="Environment variables">
          <pre className="overflow-x-auto rounded-3xl bg-card p-5 text-xs leading-6 text-muted-foreground">{`# server only
DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
AWS_ACCESS_KEY_ID  AWS_SECRET_ACCESS_KEY  S3_BUCKET_MASTERS
YOUTUBE_API_KEY
FCM_SERVER_KEY
PAYMENT_WEBHOOK_SECRET
BETTER_AUTH_SECRET

# client-safe
VITE_SUPABASE_URL  VITE_SUPABASE_ANON_KEY
VITE_API_BASE`}</pre>
        </Section>

        <Section n="10" title="CI / CD">
          <p className="text-sm leading-relaxed text-muted-foreground">
            GitHub Actions: install → format → flutter analyze / tsc → tests → docker build → deploy
            staging on development, production on tagged release. Never migrate production from a
            laptop.
          </p>
        </Section>

        <Section n="11" title="Security model">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Never trust client user id, price, commission, or purchase status.</li>
            <li>JWT / session verified on the API. RLS as defense in depth.</li>
            <li>Presigned uploads with MIME and size validation; virus/metadata scan on worker.</li>
            <li>Webhook signatures required. Ledger is append-only.</li>
            <li>Rate limits, audit log, device history, payout review for high risk.</li>
          </ul>
        </Section>

        <Section n="12" title="Build order">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Repo, docs, env contract, CI skeleton</li>
            <li>Postgres schema + RLS + seed</li>
            <li>Auth (email, Google, Apple on native)</li>
            <li>Design system + navigation + player shell</li>
            <li>Profiles and onboarding</li>
            <li>Catalog, search, streaming, playlists</li>
            <li>Uploads + FFmpeg worker + S3</li>
            <li>Checkout, ledger, payouts</li>
            <li>Discovery, YouTube, trending</li>
            <li>Community, messaging, events, live, admin</li>
          </ol>
        </Section>
      </article>
    </main>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section>
      <p className="text-xs tracking-[0.25em] text-sand uppercase">{n}</p>
      <h2 className="mt-2 font-display text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
