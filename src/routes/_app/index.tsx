import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { getHomeData } from "@/lib/verzzify/queries";
import { usePlayer } from "@/lib/verzzify/player";
import { CoverCard, ArtistTile } from "@/components/cover-card";
import { TrackRow } from "@/components/track-row";
import { SectionRail } from "@/components/section-rail";
import { Button } from "@/components/ui/button";
import { YouTubePromotionCard } from "@/components/youtube-promotion-card";
import { YoutubeHome } from "@/components/youtube-home";
import { DownloadsFolder } from "@/components/downloads-folder";
import { TicketsRail } from "@/components/tickets-rail";
import { BoomplayRail } from "@/components/boomplay-rail";

export const Route = createFileRoute("/_app/")({
  loader: () => getHomeData(),
  component: Home,
});

function Home() {
  const d = Route.useLoaderData();
  const play = usePlayer((s) => s.play);
  if (!d) {
    return <p className="py-16 text-muted-foreground">The catalog could not load. Refresh to try again.</p>;
  }
  const hero = d.trending[0];

  return (
    <div>
      {hero && (
        <section className="relative overflow-hidden rounded-2xl md:rounded-3xl">
          <img src={hero.coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20" />
          <div className="relative flex min-h-[240px] flex-col justify-end gap-4 p-5 md:min-h-[320px] md:flex-row md:items-end md:justify-between md:p-8">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
                Trending
                {d.youtubeHome?.regionName ? ` · ${d.youtubeHome.regionName}` : ""}
              </p>
              <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight md:text-6xl">{hero.title}</h1>
              <Link
                to="/artist/$slug"
                params={{ slug: hero.artistSlug }}
                className="mt-2 inline-block text-[15px] font-semibold text-white/80 hover:text-white"
              >
                {hero.artistName}
              </Link>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => play(d.trending, 0)}>
                  <Play className="size-4 translate-x-px fill-current" />
                  Play
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/track/$id" params={{ id: hero.id }}>
                    Open song
                  </Link>
                </Button>
              </div>
            </div>
            <img
              src={hero.coverUrl}
              alt=""
              className="hidden size-36 rounded-xl object-cover shadow-lg ring-1 ring-white/15 md:block md:size-44"
            />
          </div>
        </section>
      )}

      <section className="mt-10">
        <DownloadsFolder compact />
      </section>

      {d.youtubeHome && <YoutubeHome initial={d.youtubeHome} />}

      <BoomplayRail />

      <TicketsRail />

      {d.promoted.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] text-sand uppercase">Sponsored</p>
              <h2 className="font-display text-xl font-medium md:text-2xl">Promoted Music</h2>
            </div>
            <p className="text-xs text-muted-foreground">Plays in VerzZify</p>
          </div>
          <div className="media-rail media-rail-wide">
            {d.promoted.map((p) => (
              <YouTubePromotionCard key={p.campaignId} promo={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Trending songs</h2>
          <Link to="/charts" className="text-sm font-medium text-primary">
            See all
          </Link>
        </div>
        <div className="grid md:grid-cols-2 md:gap-x-6">
          {d.trending.slice(0, 10).map((t, i) => (
            <TrackRow key={t.id} track={t} queue={d.trending} index={i} />
          ))}
        </div>
      </section>

      {d.playlists.length > 0 && (
        <SectionRail title="Playlists">
          {d.playlists.map((p) => (
            <Link key={p.id} to="/playlist/$id" params={{ id: p.id }} className="min-w-0">
              <img
                src={p.coverUrl ?? d.trending[0]?.coverUrl ?? "/favicon.svg"}
                alt=""
                className="aspect-square w-full rounded-xl object-cover"
              />
              <p className="mt-2 truncate text-sm font-semibold">{p.title}</p>
              <p className="truncate text-xs text-muted-foreground">{p.kind}</p>
            </Link>
          ))}
        </SectionRail>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] text-sand uppercase">This week</p>
            <h2 className="font-display text-xl font-medium md:text-2xl">VerzZify Global 200</h2>
          </div>
          <Link to="/charts" className="text-sm text-muted-foreground hover:text-foreground">
            Full charts
          </Link>
        </div>
        <div className="rounded-3xl bg-card p-2 md:p-3">
          {d.charts.map((t, i) => (
            <TrackRow key={t.id} track={t} queue={d.charts} index={i} />
          ))}
        </div>
      </section>

      {d.fromFollowed && d.fromFollowed.length > 0 && (
        <SectionRail title="From artists you follow">
          {d.fromFollowed.map((t) => (
            <CoverCard key={t.id} track={t} queue={d.fromFollowed} />
          ))}
        </SectionRail>
      )}

      <SectionRail title="Top artists" to="/discover">
        {d.artists.map((a) => (
          <ArtistTile
            key={a.id}
            id={a.id}
            slug={a.slug}
            name={a.name}
            avatarUrl={a.avatarUrl}
            verified={a.verified}
            followed={d.followingIds?.includes(a.id)}
          />
        ))}
      </SectionRail>

      <SectionRail title="New releases">
        {d.newest.map((t) => (
          <CoverCard key={t.id} track={t} queue={d.newest} />
        ))}
      </SectionRail>

      <SectionRail title="Hip Hop">
        {d.hiphop.map((t) => (
          <CoverCard key={t.id} track={t} queue={d.hiphop} />
        ))}
      </SectionRail>

      <SectionRail title="Pop worldwide">
        {d.pop.map((t) => (
          <CoverCard key={t.id} track={t} queue={d.pop} />
        ))}
      </SectionRail>

      <SectionRail title="Latin">
        {d.latin.map((t) => (
          <CoverCard key={t.id} track={t} queue={d.latin} />
        ))}
      </SectionRail>

      <SectionRail title="Electronic">
        {d.electronic.map((t) => (
          <CoverCard key={t.id} track={t} queue={d.electronic} />
        ))}
      </SectionRail>

      <SectionRail title="Afrobeats">
        {d.afrobeats.map((t) => (
          <CoverCard key={t.id} track={t} queue={d.afrobeats} />
        ))}
      </SectionRail>

      <SectionRail title="After dark">
        {d.amapiano.map((t) => (
          <CoverCard key={t.id} track={t} queue={d.amapiano} />
        ))}
      </SectionRail>

      <SectionRail title="Sunday light">
        {d.gospel.map((t) => (
          <CoverCard key={t.id} track={t} queue={d.gospel} />
        ))}
      </SectionRail>

      <SectionRail title="Free to keep">
        {d.free.map((t) => (
          <CoverCard key={t.id} track={t} queue={d.free} subtitle="Authorized download" />
        ))}
      </SectionRail>

      {d.live.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl font-medium">VerzZify Live</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {d.live.map((l) => (
              <Link
                key={l.id}
                to="/live/$id"
                params={{ id: l.id }}
                className="overflow-hidden rounded-3xl bg-card"
              >
                <img src={l.posterUrl} alt="" className="aspect-[16/9] w-full object-cover" />
                <div className="p-4">
                  <p className="text-xs tracking-widest text-sand uppercase">
                    {l.isFree ? "Free" : "Pay-per-view"}
                  </p>
                  <h3 className="mt-1 font-display text-lg">{l.title}</h3>
                  <p className="text-sm text-muted-foreground">{l.artistName}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {d.events.length > 0 && (
        <SectionRail title="Upcoming nights">
          {d.events.map((e) => (
            <Link key={e.id} to="/event/$id" params={{ id: e.id }} className="min-w-0">
              <img src={e.posterUrl} alt="" className="aspect-[3/4] w-full rounded-2xl object-cover" />
              <p className="mt-2 truncate text-sm font-medium">{e.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {e.city} · {e.venue}
              </p>
            </Link>
          ))}
        </SectionRail>
      )}
    </div>
  );
}
