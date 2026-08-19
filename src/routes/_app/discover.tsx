import { createFileRoute, Link } from "@tanstack/react-router";
import { getDiscover } from "@/lib/zelyro/queries";
import { CoverCard, ArtistTile } from "@/components/cover-card";
import { SectionRail } from "@/components/section-rail";
import { YouTubePromotionCard } from "@/components/youtube-promotion-card";

export const Route = createFileRoute("/_app/discover")({
  loader: () => getDiscover(),
  component: Discover,
});

function Discover() {
  const d = Route.useLoaderData();
  if (!d) return null;
  const genres = [
    { name: "Hip Hop", img: "/covers/desk-light.jpg" },
    { name: "Afrobeats", img: "/covers/terrace-lights.jpg" },
    { name: "Gospel", img: "/covers/morning-mercy.jpg" },
    { name: "Dancehall", img: "/covers/rooftop-fire.jpg" },
    { name: "Amapiano", img: "/covers/warehouse.jpg" },
    { name: "Highlife", img: "/covers/gold-coast.jpg" },
    { name: "R&B", img: "/covers/jacaranda.jpg" },
    { name: "Electronic", img: "/covers/night-market.jpg" },
  ];
  const nearby = d.nearby;
  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl">Discover</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Charts, rooms, and catalogs — Zelyro-hosted first. YouTube stays in its own lane, clearly marked.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {genres.map((g) => (
          <Link
            key={g.name}
            to="/search"
            search={{ q: g.name }}
            className="relative overflow-hidden rounded-2xl"
          >
            <img src={g.img} alt="" className="aspect-[4/3] w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3 text-sm font-medium">
              {g.name}
            </span>
          </Link>
        ))}
      </div>

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
                <ArtistTile key={a.id} slug={a.slug} name={a.name} avatarUrl={a.avatarUrl} verified={a.verified} />
              ))}
          </SectionRail>
          <SectionRail title="Producers nearby">
            {nearby.producers.map((p) => (
              <ArtistTile key={p.id} slug={p.slug} name={p.name} avatarUrl={p.avatarUrl} />
            ))}
          </SectionRail>
          <SectionRail title="Creators nearby">
            {nearby.artists.map((a) => (
              <ArtistTile key={`c-${a.id}`} slug={a.slug} name={a.name} avatarUrl={a.avatarUrl} verified={a.verified} />
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
