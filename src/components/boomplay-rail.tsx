import { useQuery } from "@tanstack/react-query";
import { CoverCard } from "@/components/cover-card";
import { getBoomplayHome } from "@/lib/verzzify/boomplay";
import { getViewerGeo } from "@/lib/verzzify/geo";

export function BoomplayRail() {
  const q = useQuery({
    queryKey: ["verzzify-cuts"],
    queryFn: async () => {
      const geo = await getViewerGeo();
      const pack = await getBoomplayHome({ data: geo.region });
      return { region: geo.regionName || geo.region, ...pack };
    },
  });
  const popular = q.data?.popular ?? [];
  const fresh = q.data?.fresh ?? [];
  if (!q.isFetching && !popular.length && !fresh.length) return null;
  return (
    <div>
      {fresh.length > 0 && (
        <section className="mt-10">
          <p className="text-xs tracking-[0.2em] text-sand uppercase">VerzZify</p>
          <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            New songs{q.data?.region ? ` in ${q.data.region}` : ""}
          </h2>
          <div className="media-rail mt-4">
            {fresh.map((t) => (
              <CoverCard key={t.id} track={t} queue={fresh} subtitle={t.artistName} />
            ))}
          </div>
        </section>
      )}
      {(popular.length > 0 || q.isFetching) && (
        <section className="mt-10">
          <p className="text-xs tracking-[0.2em] text-sand uppercase">VerzZify</p>
          <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            Popular on VerzZify{q.data?.region ? ` · ${q.data.region}` : ""}
          </h2>
          {q.isFetching && !popular.length ? (
            <div className="media-rail mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : (
            <div className="media-rail mt-4">
              {popular.map((t) => (
                <CoverCard key={t.id} track={t} queue={popular} subtitle={t.artistName} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
