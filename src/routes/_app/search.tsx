import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { searchCatalog } from "@/lib/zelyro/queries";
import { ArtistTile } from "@/components/cover-card";
import { TrackRow } from "@/components/track-row";
import { Input } from "@/components/ui/input";
import { YouTubePromotionCard } from "@/components/youtube-promotion-card";
import { useYtPlayer } from "@/lib/zelyro/yt-player";
import { Play } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/_app/search")({
  validateSearch: searchSchema,
  component: SearchPage,
});

function SearchPage() {
  const { q: initial } = Route.useSearch();
  const [q, setQ] = useState(initial ?? "");
  const query = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchCatalog({ data: q }),
    enabled: q.trim().length > 0,
  });
  const data = query.data;
  const openYt = useYtPlayer((s) => s.open);

  return (
    <div>
      <h1 className="font-display text-3xl">Search</h1>
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Artists, songs, cities, genres, YouTube…"
          autoFocus
        />
      </form>
      {!q && (
        <div className="mt-8 flex flex-wrap gap-2">
          {["Hip Hop", "Gospel", "Afrobeats", "Ama Serwaa", "London", "YouTube"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQ(s)}
              className="rounded-full bg-secondary px-4 py-2 text-sm"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {data && (
        <div className="mt-8 space-y-10">
          <section>
            <p className="text-xs tracking-widest text-sand uppercase">Zelyro</p>
            <h2 className="mb-3 font-display text-xl">Catalog</h2>
            {data.tracks.map((t, i) => (
              <TrackRow key={t.id} track={t} queue={data.tracks} index={i} />
            ))}
            {data.tracks.length === 0 && (
              <p className="text-sm text-muted-foreground">No Zelyro tracks matched.</p>
            )}
          </section>
          {data.artists.length > 0 && (
            <div>
              <h2 className="mb-3 font-display text-lg">Artists & producers</h2>
              <div className="media-rail">
                {data.artists.map((a) => (
                  <ArtistTile key={a.id} slug={a.slug} name={a.name} avatarUrl={a.avatarUrl} verified={a.verified} />
                ))}
              </div>
            </div>
          )}
          {data.albums.length > 0 && (
            <div className="media-rail">
              {data.albums.map((a) => (
                <Link key={a.id} to="/album/$id" params={{ id: a.id }} className="min-w-0">
                  <img src={a.coverUrl} alt="" className="aspect-square w-full rounded-2xl object-cover" />
                  <p className="mt-2 truncate text-sm">{a.title}</p>
                </Link>
              ))}
            </div>
          )}
          <section>
            <p className="text-xs tracking-widest text-sand uppercase">YouTube</p>
            <h2 className="mt-1 font-display text-xl">Hosted on YouTube</h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Separate from Zelyro-hosted songs. Play uses YouTube's official player.
            </p>
            {data.youtube.promoted.length > 0 && (
              <div className="media-rail media-rail-wide mb-6">
                {data.youtube.promoted.map((p) => (
                  <YouTubePromotionCard key={p.campaignId} promo={p} />
                ))}
              </div>
            )}
            <ul className="space-y-2">
              {data.youtube.videos.map((v) => (
                <li key={v.videoId}>
                  <button
                    type="button"
                    onClick={() =>
                      openYt({
                        videoId: v.videoId,
                        title: v.title,
                        channel: v.channelName,
                        watchUrl: v.url,
                      })
                    }
                    className="flex w-full items-center gap-3 rounded-2xl bg-card p-2 text-left"
                  >
                    <img src={v.thumbnailUrl} alt="" className="aspect-video w-28 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{v.title}</span>
                      <span className="block text-xs text-muted-foreground">{v.channelName} · YouTube</span>
                    </span>
                    <Play className="size-4 fill-current" />
                  </button>
                </li>
              ))}
            </ul>
            {data.youtube.videos.length === 0 && data.youtube.promoted.length === 0 && (
              <p className="text-sm text-muted-foreground">No YouTube matches for that search.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
