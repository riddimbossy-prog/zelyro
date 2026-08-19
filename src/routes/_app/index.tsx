import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { getHomeData } from "@/lib/sheba/queries";
import { usePlayer } from "@/lib/sheba/player";
import { CoverCard, ArtistTile } from "@/components/cover-card";
import { TrackRow } from "@/components/track-row";
import { SectionRail } from "@/components/section-rail";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/sheba/copy";
import { YouTubePromotionCard } from "@/components/youtube-promotion-card";

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
        <section className="relative overflow-hidden rounded-[28px] bg-secondary">
          <img
            src="/banners/hero.jpg"
            alt=""
            className="absolute inset-0 size-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/55 to-transparent" />
          <div className="relative grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_220px] md:p-10">
            <div>
              <p className="text-xs tracking-[0.2em] text-sand uppercase">Sheba original</p>
              <h1 className="mt-3 font-display text-4xl font-medium md:text-5xl">{copy.tagline}</h1>
              <p className="mt-3 max-w-lg text-sm text-muted-foreground md:text-base">{copy.sub}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => play(d.trending, 0)}>
                  <Play className="size-4 translate-x-px fill-current" />
                  Play Ghana trending
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/welcome">For artists</Link>
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => play(d.trending, 0)}
              className="hidden overflow-hidden rounded-2xl md:block"
            >
              <img src={hero.coverUrl} alt="" className="aspect-square w-full object-cover" />
            </button>
          </div>
        </section>
      )}

      {d.promoted.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] text-sand uppercase">Sponsored</p>
              <h2 className="font-display text-xl font-medium md:text-2xl">Promoted Music</h2>
            </div>
            <p className="text-xs text-muted-foreground">YouTube · official player</p>
          </div>
          <div className="sheba-rail sheba-rail-wide">
            {d.promoted.map((p) => (
              <YouTubePromotionCard key={p.campaignId} promo={p} />
            ))}
          </div>
        </section>
      )}

      <SectionRail title="Trending now">
        {d.trending.map((t) => (
          <CoverCard key={t.id} track={t} queue={d.trending} />
        ))}
      </SectionRail>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl font-medium md:text-2xl">Ghana charts</h2>
        <div className="rounded-3xl bg-card p-2 md:p-3">
          {d.ghana.map((t, i) => (
            <TrackRow key={t.id} track={t} queue={d.ghana} index={i} />
          ))}
        </div>
      </section>

      <SectionRail title="Top artists" to="/discover">
        {d.artists.map((a) => (
          <ArtistTile key={a.id} slug={a.slug} name={a.name} avatarUrl={a.avatarUrl} verified={a.verified} />
        ))}
      </SectionRail>

      <SectionRail title="New releases">
        {d.newest.map((t) => (
          <CoverCard key={t.id} track={t} queue={d.newest} />
        ))}
      </SectionRail>

      <SectionRail title="Afrobeats">
        {d.afrobeats.map((t) => (
          <CoverCard key={t.id} track={t} queue={d.afrobeats} />
        ))}
      </SectionRail>

      <SectionRail title="Amapiano after dark">
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
          <h2 className="mb-4 font-display text-xl font-medium">Sheba Live</h2>
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
