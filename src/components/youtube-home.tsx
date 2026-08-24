import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getYoutubeHome, REGION_LIST, REGION_NAMES, type YoutubeHomeData } from "@/lib/verzzify/yt-charts";
import { YtVideoCard } from "@/components/yt-video-card";
import { useYtPlayer } from "@/lib/verzzify/yt-player";
import { cn } from "@/lib/utils";
import type { YtPlaylistCard } from "@/lib/verzzify/types";

export function YoutubeHome({
  initial,
}: {
  initial: YoutubeHomeData;
}) {
  const [region, setRegion] = useState(initial.region);
  const openQueue = useYtPlayer((s) => s.openQueue);

  const homeQ = useQuery({
    queryKey: ["yt-home", region],
    queryFn: () => getYoutubeHome({ data: region }),
    initialData: region === initial.region ? initial : undefined,
    placeholderData: (prev) => prev,
  });

  const data = homeQ.data ?? initial;
  const regions = useMemo(() => {
    const extras = [data.region, ...data.nearby.map((n) => n.region)];
    const list = [...new Set([...extras, ...REGION_LIST])];
    return list;
  }, [data.region, data.nearby]);

  const place = data.city ? `${data.city} · ${data.regionName}` : data.regionName;

  return (
    <div className="mt-10">
      <div>
        <p className="kicker">Around your streets</p>
        <h2 className="font-display text-2xl md:text-3xl">Popular in {place}</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          What the city is spinning — played only inside VerzZify.
        </p>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {regions.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setRegion(code)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3 text-xs",
              region === code ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
            )}
          >
            {REGION_NAMES[code] ?? code}
          </button>
        ))}
      </div>

      {data.feed.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-4 font-display text-xl md:text-2xl">Your street feed</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.feed.slice(0, 9).map((v) => (
              <YtVideoCard key={`feed-${v.videoId}`} video={v} queue={data.feed} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h3 className="mb-4 font-display text-xl md:text-2xl">Popular songs in {data.regionName}</h3>
        <div className="media-rail media-rail-wide">
          {data.videos.map((v) => (
            <YtVideoCard key={v.videoId} video={v} queue={data.videos} />
          ))}
        </div>
      </section>

      {(data.rails ?? []).map((rail) =>
        rail.videos.length ? (
          <section key={rail.id} className="mt-8">
            <h3 className="mb-1 font-display text-xl md:text-2xl">{rail.title}</h3>
            <p className="mb-4 text-sm text-muted-foreground">{rail.subtitle}</p>
            <div className="media-rail media-rail-wide">
              {rail.videos.map((v) => (
                <YtVideoCard key={`${rail.id}-${v.videoId}`} video={v} queue={rail.videos} />
              ))}
            </div>
          </section>
        ) : null,
      )}

      <section className="mt-8">
        <h3 className="mb-4 font-display text-xl md:text-2xl">Popular artists</h3>
        <div className="media-rail">
          {data.artists.map((a) => {
            const queue = data.videos.filter(
              (v) => v.channelName === a.channelName || v.channelId === a.channelId,
            );
            return (
              <button
                key={a.channelId}
                type="button"
                className="min-w-0"
                onClick={() => {
                  if (queue[0]) openQueue(queue.length ? queue : data.videos, 0);
                }}
              >
                <img
                  src={a.avatarUrl ?? "/favicon.svg"}
                  alt=""
                  className="cover-shine aspect-square w-full rounded-full object-cover"
                />
                <p className="mt-2 truncate text-sm font-medium">{a.channelName}</p>
                <p className="truncate text-xs text-muted-foreground">{data.regionName}</p>
              </button>
            );
          })}
        </div>
      </section>

      {data.playlists.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-4 font-display text-xl md:text-2xl">Popular playlists</h3>
          <div className="media-rail media-rail-wide">
            {data.playlists.map((p) => (
              <PlaylistTile key={p.id} playlist={p} />
            ))}
          </div>
        </section>
      )}

      {data.nearby.map((n) => (
        <div key={n.region} className="mt-10">
          <section>
            <h3 className="mb-4 font-display text-xl md:text-2xl">Stars in {n.regionName}</h3>
            <div className="media-rail">
              {n.artists.map((a) => {
                const queue = n.videos.filter(
                  (v) => v.channelName === a.channelName || v.channelId === a.channelId,
                );
                return (
                  <button
                    key={`${n.region}-${a.channelId}`}
                    type="button"
                    className="min-w-0"
                    onClick={() => openQueue(queue.length ? queue : n.videos, 0)}
                  >
                    <img
                      src={a.avatarUrl ?? "/favicon.svg"}
                      alt=""
                      className="cover-shine aspect-square w-full rounded-full object-cover"
                    />
                    <p className="mt-2 truncate text-sm font-medium">{a.channelName}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.regionName}</p>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="mt-6">
            <h3 className="mb-4 font-display text-xl md:text-2xl">Songs from {n.regionName}</h3>
            <div className="media-rail media-rail-wide">
              {n.videos.map((v) => (
                <YtVideoCard key={`${n.region}-${v.videoId}`} video={v} queue={n.videos} />
              ))}
            </div>
          </section>
        </div>
      ))}
    </div>
  );
}

function PlaylistTile({ playlist }: { playlist: YtPlaylistCard }) {
  const openQueue = useYtPlayer((s) => s.openQueue);
  return (
    <button
      type="button"
      className="min-w-0 text-left"
      onClick={() => openQueue(playlist.videos, 0)}
    >
      <img src={playlist.thumbnailUrl} alt="" className="cover-shine aspect-video w-full rounded-2xl object-cover" />
      <p className="mt-2 truncate text-sm font-medium">{playlist.title}</p>
      <p className="truncate text-xs text-muted-foreground">
        {playlist.subtitle} · {playlist.videos.length} songs
      </p>
    </button>
  );
}
