import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CATALOG_COUNTRIES, MUSIC_GENRES, getCountryGenreCatalog } from "@/lib/verzzify/yt-catalog";
import { YtVideoCard } from "@/components/yt-video-card";
import { useYtPlayer } from "@/lib/verzzify/yt-player";
import { cn } from "@/lib/utils";

export function YtWorldCatalog({ initialRegion = "GH" }: { initialRegion?: string }) {
  const [region, setRegion] = useState(initialRegion);
  const [genre, setGenre] = useState<(typeof MUSIC_GENRES)[number]["id"]>("afrobeats");
  const openQueue = useYtPlayer((s) => s.openQueue);
  const slice = useQuery({
    queryKey: ["yt-catalog", region, genre],
    queryFn: () => getCountryGenreCatalog({ data: { region, genre } }),
  });
  const data = slice.data;
  const countries = useMemo(() => CATALOG_COUNTRIES, []);

  return (
    <section className="mt-10">
      <p className="text-xs tracking-[0.2em] text-sand uppercase">World catalog</p>
      <h2 className="font-display text-2xl md:text-3xl">Musicians by country & genre</h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        Live YouTube music, grouped the way people listen. Tap a country, then a genre — plays in VerzZify.
      </p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {countries.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setRegion(c.code)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3 text-xs",
              region === c.code ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {MUSIC_GENRES.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGenre(g.id)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3 text-xs",
              genre === g.id ? "bg-foreground text-background" : "glass text-foreground",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {slice.isFetching && <p className="mt-6 text-sm text-muted-foreground">Pulling {genre} from {region}…</p>}

      {data && data.artists.length > 0 && (
        <div className="media-rail mt-6">
          {data.artists.map((a) => {
            const queue = data.videos.filter((v) => v.channelId === a.channelId || v.channelName === a.channelName);
            return (
              <button
                key={a.channelId}
                type="button"
                className="min-w-0"
                onClick={() => openQueue(queue.length ? queue : data.videos, 0)}
              >
                <img src={a.avatarUrl ?? "/favicon.svg"} alt="" className="cover-shine aspect-square w-full rounded-full object-cover" />
                <p className="mt-2 truncate text-sm font-medium">{a.channelName}</p>
                <p className="truncate text-xs text-muted-foreground">{data.regionName}</p>
              </button>
            );
          })}
        </div>
      )}

      {data && data.videos.length > 0 && (
        <div className="media-rail media-rail-wide mt-6">
          {data.videos.map((v) => (
            <YtVideoCard key={`${data.region}-${data.genre}-${v.videoId}`} video={v} queue={data.videos} />
          ))}
        </div>
      )}

      {data && !slice.isFetching && data.videos.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">No public music matched that mix yet. Try another genre.</p>
      )}
    </section>
  );
}
