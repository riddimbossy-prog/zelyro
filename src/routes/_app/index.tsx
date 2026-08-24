import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "@/components/icons";
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
import { HomeHero } from "@/components/home-hero";

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
  const heroVideos = d.youtubeHome
    ? [...(d.youtubeHome.newSongs ?? []).slice(0, 4), ...d.youtubeHome.videos].filter(
        (v, i, all) => all.findIndex((x) => x.videoId === v.videoId) === i,
      )
    : [];

  return (
    <div>
      {heroVideos.length > 0 ? (
        <HomeHero videos={heroVideos} regionName={d.youtubeHome?.regionName ?? d.country} />
      ) : null}

      <section className="mt-10">
        <DownloadsFolder compact />
      </section>

      <BoomplayRail />

      {d.youtubeHome && <YoutubeHome initial={d.youtubeHome} />}

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
