import { useQuery } from "@tanstack/react-query";
import { CoverCard } from "@/components/cover-card";
import { getBoomplayHome } from "@/lib/verzzify/boomplay";
import { getViewerGeo } from "@/lib/verzzify/geo";

export function BoomplayRail() {
  const q = useQuery({
    queryKey: ["boomplay-home"],
    queryFn: async () => {
      const geo = await getViewerGeo();
      const tracks = await getBoomplayHome({ data: geo.region });
      return { region: geo.regionName || geo.region, tracks };
    },
  });
  const tracks = q.data?.tracks ?? [];
  return (
    <section className="mt-10">
      <p className="text-xs tracking-[0.2em] text-sand uppercase">Boomplay</p>
      <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
        Popular on Boomplay{q.data?.region ? ` · ${q.data.region}` : ""}
      </h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        African catalog — play and download in the VerzZify player.
      </p>
      {q.isFetching && !tracks.length && (
        <div className="media-rail mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      )}
      {tracks.length > 0 && (
        <div className="media-rail mt-4">
          {tracks.map((t) => (
            <CoverCard key={t.id} track={t} queue={tracks} subtitle={t.artistName} />
          ))}
        </div>
      )}
      {!q.isFetching && !tracks.length && (
        <p className="mt-4 text-sm text-muted-foreground">
          Boomplay needs RAPIDAPI_KEY with the Boomplay API subscribed. Search Burna Boy after that.
        </p>
      )}
    </section>
  );
}
