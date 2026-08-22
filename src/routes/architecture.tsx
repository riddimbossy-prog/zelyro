import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { copy } from "@/lib/zelyro/copy";
import { getInfraStatus } from "@/lib/infra/status";
import type { InfraStatus } from "@/lib/infra/types";

export const Route = createFileRoute("/architecture")({
  loader: () => getInfraStatus(),
  component: Architecture,
});

function Architecture() {
  const infra = Route.useLoaderData();
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
            executable slice of the same product — same schema, same money rules, same upload contract.
          </p>
        </header>

        <InfraLive status={infra} />

        <Section n="01" title="Complete architecture">
          <pre className="overflow-x-auto rounded-3xl bg-card p-5 text-xs leading-6 text-muted-foreground">{`Flutter / Web  →  Cloudflare (DNS, TLS, WAF, CDN)
                 →  DigitalOcean API  /api/v1
                      ├─ Supabase Postgres + RLS
                      ├─ AWS S3 (presigned upload / signed download)
                      ├─ YouTube Data API (search, metadata, official player)
                      ├─ YouTube promotions (campaigns, impressions, VerzZify clicks)
                      ├─ Firebase Cloud Messaging
                      ├─ Payment adapters (MoMo, cards)
                      └─ Workers (FFmpeg, waveforms, trending)`}</pre>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            The browser never talks to S3 with private keys. The API mints short-lived URLs after checking
            entitlement. Prices, commissions, and purchase status are read from the server. Row Level
            Security is a second door, not the only one. Sessions stay Better Auth — Supabase is Postgres
            + RLS, not a second login.
          </p>
        </Section>

        <Section n="02" title="GitHub repository structure">
          <pre className="overflow-x-auto rounded-3xl bg-card p-5 text-xs leading-6 text-muted-foreground">{`zelyro/
  src/                    web catalog (TanStack Start)
  migrations/             Postgres schema + seed
  infrastructure/supabase RLS policies
  infrastructure/aws      CORS + bucket plan
  scripts/provision-infra.mjs
  docs/`}</pre>
          <p className="mt-4 text-sm text-muted-foreground">
            Branches: main, development, feature/*. Secrets live in GitHub Secrets and the host —
            never in the repo. CI runs analyze, unit tests, API tests, then staging deploy.
          </p>
        </Section>

        <Section n="03" title="Supabase schema / ERD">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Set <span className="text-foreground">DATABASE_URL</span> or{" "}
            <span className="text-foreground">SUPABASE_DB_URL</span> to the pooler URI. Service role is
            server-only. Apply <span className="text-foreground">infrastructure/supabase/rls.sql</span> after
            migrations so the anon key can only read the public catalog. Preview without those vars keeps
            embedded Postgres with the same schema.
            profiles 1—1 artist_profiles; tracks N—1 artists and N—1 albums; purchases 1—N
            purchase_items and licenses; wallets 1—N ledger_entries (immutable);{" "}
            <span className="text-foreground">media_objects</span> indexes S3 keys.
            Roles: fan, artist, producer, organizer, admin, super_admin — never DJ.
          </p>
        </Section>

        <Section n="04" title="AWS S3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Buckets: verzzify-masters (private), verzzify-stream (private, signed), verzzify-public (covers,
            banners). Upload: requestUpload → PUT presigned (or /api/storage/upload in preview) →
            completeUpload. Playback: /api/storage/media/:id. Masters never stream. Without AWS keys the
            same contract writes to a local object store so Studio uploads work here.
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
            tickets, livestreams, security. Auth remains Better Auth — not duplicated in Firebase.
          </p>
        </Section>

        <Section n="08" title="YouTube integration">
          <p className="text-sm leading-relaxed text-muted-foreground">
            YouTubeService: searchVideos, searchMusic, searchArtists, getVideoDetails, getChannelDetails,
            getRelatedVideos, getPlaylistDetails, validateYouTubeUrl, extractVideoId, getVideoThumbnail,
            getPublicVideoStats. YouTubePromotionService: create, validate, activate, pause,
            recordImpression, recordClick, recordPlaybackOpen, getCampaignAnalytics. UI labels VerzZify vs
            Catalog search. Playback stays in VerzZify chrome. No extraction, no offline rips, no DRM bypass.
            VerzZify clicks and playback opens are never reported as YouTube views.
          </p>
        </Section>

        <Section n="09" title="Environment variables">
          <pre className="overflow-x-auto rounded-3xl bg-card p-5 text-xs leading-6 text-muted-foreground">{`# server only
DATABASE_URL  or  SUPABASE_DB_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
AWS_ACCESS_KEY_ID  AWS_SECRET_ACCESS_KEY  AWS_REGION
S3_MASTERS_BUCKET  S3_STREAM_BUCKET  S3_PUBLIC_BUCKET
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
            laptop. Bucket create: npm run infra:provision.
          </p>
        </Section>

        <Section n="11" title="Security model">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Never trust client user id, price, commission, or purchase status.</li>
            <li>Session verified on the API. RLS as defense in depth.</li>
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

function InfraLive({ status }: { status: InfraStatus }) {
  return (
    <section>
      <p className="text-xs tracking-[0.25em] text-sand uppercase">Live this preview</p>
      <h2 className="mt-2 font-display text-2xl">Connected services</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StatusCard
          title="Postgres"
          ok={status.postgres.connected}
          lines={[
            status.postgres.mode === "postgres" ? "Supabase / remote Postgres" : "Embedded PGLite (preview)",
            status.postgres.connected ? "Schema applied" : "Down",
          ]}
        />
        <StatusCard
          title="Supabase API"
          ok={Boolean(status.supabase.configured && status.supabase.reachable)}
          lines={
            status.supabase.configured
              ? [
                  status.supabase.host ?? "configured",
                  status.supabase.serviceRole ? "service role on server" : "anon only",
                  status.supabase.reachable ? "reachable" : "not reachable yet",
                ]
              : ["Not injected in this preview", "SQL still runs locally"]
          }
        />
        <StatusCard
          title="Object store"
          ok={status.s3.reachable}
          lines={[
            status.s3.mode === "aws" ? `AWS · ${status.s3.region}` : "Local object store (preview)",
            `${status.s3.buckets.masters} · ${status.s3.buckets.stream} · ${status.s3.buckets.public}`,
            status.s3.error ?? "Presigned PUT / signed GET ready",
          ]}
        />
      </div>
    </section>
  );
}

function StatusCard({ title, ok, lines }: { title: string; ok: boolean; lines: string[] }) {
  return (
    <article className="rounded-3xl bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg">{title}</h3>
        <span className={ok ? "text-xs text-primary" : "text-xs text-muted-foreground"}>
          {ok ? "Ready" : "Preview"}
        </span>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
        {lines.map((l, i) => (
          <li key={`${i}-${l}`}>{l}</li>
        ))}
      </ul>
    </article>
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
