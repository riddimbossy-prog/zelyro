import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getGenreHome } from "@/lib/verzzify/genre-home";
import { getGenre } from "@/lib/verzzify/genres";
import { REGION_LIST, REGION_NAMES } from "@/lib/verzzify/yt-charts";
import { HomeHero } from "@/components/home-hero";
import { GenreChips } from "@/components/genre-chips";
import { YtVideoCard } from "@/components/yt-video-card";
import { useYtPlayer } from "@/lib/verzzify/yt-player";
import { cn } from "@/lib/utils";
import type { YtPlaylistCard } from "@/lib/verzzify/types";

export const Route = createFileRoute("/_app/genre/$slug")({
  loader: async ({ params }) => {
    const data = await getGenreHome({ data: { slug: params.slug } });
    return data;
  },
  component: GenrePage,
});

function GenrePage() {
  const initial = Route.useLoaderData();
  const { slug } = Route.useParams();
  const def = getGenre(slug);
  const [region, setRegion] = useState(initial?.region ?? "US");
  const openQueue = useYtPlayer((s) => s.openQueue);

  const q = useQuery({
    queryKey: ["genre-home", slug, region],
    queryFn: () => getGenreHome({ data: { slug, region } }),
    initialData: initial && region === initial.region ? initial : undefined,
    placeholderData: (prev) => prev,
  });

  const data = q.data ?? initial;
  const regions = useMemo(() => {
    if (!data) return [...REGION_LIST];
    return [...new Set([data.region, ...data.nearby.map((n) => n.region), ...REGION_LIST])];
  }, [data]);

  if (!def) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Unknown genre.</p>
        <Link to="/discover" className="mt-4 inline-block text-primary">
          Back to Discover
        </Link>
      </div>
    );
  }

  if (!data) {
    return <p className="py-16 text-muted-foreground">Loading {def.name}…</p>;
  }

  const place = data.city ? `${data.city} · ${data.regionName}` : data.regionName;
  const hero = [...(data.newSongs ?? []).slice(0, 3), ...data.videos].filter(
    (v, i, all) => all.findIndex((x) => x.videoId === v.videoId) === i,
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link to="/discover" className="hover:text-foreground">
          Discover
        </Link>
        <span>/</span>
        <span className="text-foreground">{def.name}</span>
      </div>

      <div
        className="mb-6 rounded-[28px] p-5 text-white shadow-lg md:p-7"
        style={{
          background: def.gradient,
          boxShadow: `0 16px 40px ${def.glow}`,
        }}
      >
        <p className="text-[11px] font-extrabold tracking-[0.22em] uppercase opacity-90">
          Genre · near you
        </p>
        <h1 className="mt-1 font-display text-4xl font-extrabold md:text-5xl">
          {def.emoji} {def.name}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/85">
          Popular artists, trending songs, and new cuts from {place} — sorted for this scene on VerzZify.
        </p>
      </div>

      <GenreChips active={def.slug} />

      {hero.length > 0 && (
        <div className="mt-8">
          <HomeHero videos={hero} regionName={`${def.name} · ${data.regionName}`} />
        </div>
      )}

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {regions.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setRegion(code)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3 text-xs font-semibold",
              region === code ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
            )}
          >
            {REGION_NAMES[code] ?? code}
          </button>
        ))}
      </div>

      {data.feed.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-display text-2xl">{def.name} feed · {place}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.feed.slice(0, 9).map((v) => (
              <YtVideoCard key={`feed-${v.videoId}`} video={v} queue={data.feed} />
            ))}
          </div>
        </section>
      )}

      {(data.newSongs ?? []).length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-display text-2xl">New {def.name} in {data.regionName}</h2>
          <div className="media-rail media-rail-wide">
            {data.newSongs.map((v) => (
              <YtVideoCard key={`new-${v.videoId}`} video={v} queue={data.newSongs} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-4 font-display text-2xl">Trending {def.name}</h2>
        <div className="media-rail media-rail-wide">
          {data.videos.map((v) => (
            <YtVideoCard key={v.videoId} video={v} queue={data.videos} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-2xl">Popular {def.name} artists</h2>
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
                onClick={() => openQueue(queue.length ? queue : data.videos, 0)}
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

      {(data.rails ?? []).map((rail) =>
        rail.videos.length ? (
          <section key={rail.id} className="mt-8">
            <h2 className="mb-1 font-display text-2xl">{rail.title}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{rail.subtitle}</p>
            <div className="media-rail media-rail-wide">
              {rail.videos.map((v) => (
                <YtVideoCard key={`${rail.id}-${v.videoId}`} video={v} queue={rail.videos} />
              ))}
            </div>
          </section>
        ) : null,
      )}

      {data.playlists.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-display text-2xl">{def.name} playlists</h2>
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
            <h2 className="mb-4 font-display text-2xl">
              {def.name} stars in {n.regionName}
            </h2>
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
            <h2 className="mb-4 font-display text-2xl">
              {def.name} from {n.regionName}
            </h2>
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
    <button type="button" className="min-w-0 text-left" onClick={() => openQueue(playlist.videos, 0)}>
      <img
        src={playlist.thumbnailUrl}
        alt=""
        className="cover-shine aspect-video w-full rounded-2xl object-cover"
      />
      <p className="mt-2 truncate text-sm font-medium">{playlist.title}</p>
      <p className="truncate text-xs text-muted-foreground">
        {playlist.subtitle} · {playlist.videos.length} songs
      </p>
    </button>
  );
}
