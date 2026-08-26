import { createFileRoute, Link } from "@tanstack/react-router";
import { getDiscover } from "@/lib/verzzify/queries";
import { CoverCard, ArtistTile } from "@/components/cover-card";
import { SectionRail } from "@/components/section-rail";
import { YouTubePromotionCard } from "@/components/youtube-promotion-card";
import { YtWorldCatalog } from "@/components/yt-world-catalog";
import { GenreChips } from "@/components/genre-chips";
import { JamendoGenreBrowse } from "@/components/jamendo-genre-browse";

export const Route = createFileRoute("/_app/discover")({
  loader: () => getDiscover(),
  component: Discover,
});

function Discover() {
  const d = Route.useLoaderData();
  if (!d) return null;
  const nearby = d.nearby;
  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl">Discover</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Pick a genre — VerzZify builds a home-style feed with popular artists and songs from your region.
      </p>

      <GenreChips />

      <JamendoGenreBrowse />

      <YtWorldCatalog />
      <Link
        to="/charts"
        className="glass mt-5 flex items-center justify-between rounded-[28px] p-5 transition-transform duration-200 hover:-translate-y-1"
      >
        <div>
          <p className="text-xs tracking-[0.2em] text-sand uppercase">Live</p>
          <p className="glow-title mt-1 font-display text-2xl">VerzZify Global 200</p>
          <p className="mt-1 text-sm text-muted-foreground">
            SEU from streams + paid downloads. Plus Global Excl. US.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">Open</span>
      </Link>

      {d.promoted.length > 0 && (
        <section className="mt-10">
          <p className="text-xs tracking-[0.2em] text-sand uppercase">Sponsored</p>
          <h2 className="mt-1 font-display text-2xl">Promoted Music</h2>
          <div className="media-rail media-rail-wide mt-4">
            {d.promoted.map((p) => (
              <YouTubePromotionCard key={p.campaignId} promo={p} />
            ))}
          </div>
        </section>
      )}

      <SectionRail title="Listening now">
        {d.trending.map((t) => (
          <CoverCard key={t.id} track={t} queue={d.trending} />
        ))}
      </SectionRail>

      {nearby && (
        <>
          <SectionRail title="Artists nearby">
            {nearby.artists
              .filter((a) => a.role === "artist")
              .map((a) => (
                <ArtistTile
                  key={a.id}
                  id={a.id}
                  slug={a.slug}
                  name={a.name}
                  avatarUrl={a.avatarUrl}
                  verified={a.verified}
                />
              ))}
          </SectionRail>
          <SectionRail title="Producers nearby">
            {nearby.producers.map((p) => (
              <ArtistTile key={p.id} id={p.id} slug={p.slug} name={p.name} avatarUrl={p.avatarUrl} />
            ))}
          </SectionRail>
          <SectionRail title="Creators nearby">
            {nearby.artists.map((a) => (
              <ArtistTile
                key={`c-${a.id}`}
                id={a.id}
                slug={a.slug}
                name={a.name}
                avatarUrl={a.avatarUrl}
                verified={a.verified}
              />
            ))}
          </SectionRail>
          {nearby.events.length > 0 && (
            <SectionRail title="Events nearby">
              {nearby.events.map((e) => (
                <Link key={e.id} to="/event/$id" params={{ id: e.id }} className="min-w-0">
                  <img src={e.posterUrl} alt="" className="aspect-[3/4] w-full rounded-2xl object-cover" />
                  <p className="mt-2 truncate text-sm">{e.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.city}</p>
                </Link>
              ))}
            </SectionRail>
          )}
          <section className="mt-10">
            <h2 className="mb-4 font-display text-xl">Studios nearby</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {nearby.studios.map((s) => (
                <article key={s.id} className="rounded-3xl bg-card p-5">
                  <p className="text-xs tracking-widest text-sand uppercase">{s.kind}</p>
                  <h3 className="mt-1 font-display text-lg">{s.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {s.city}, {s.country}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{s.description}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
