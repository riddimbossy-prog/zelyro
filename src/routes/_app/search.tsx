import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { searchCatalog } from "@/lib/verzzify/queries";
import { searchDiscover } from "@/lib/verzzify/promotions";
import { getViewerGeo } from "@/lib/verzzify/geo";
import { ArtistTile } from "@/components/cover-card";
import { TrackRow } from "@/components/track-row";
import { Input } from "@/components/ui/input";
import { YtVideoCard } from "@/components/yt-video-card";
import { cn } from "@/lib/utils";
import { z } from "zod";

const searchSchema = z.object({ q: z.string().optional() });
const KINDS = ["songs", "beats", "albums"] as const;

const LOCAL_CHIPS: Record<string, string[]> = {
  GH: ["Highlife", "Hiplife", "Ghana gospel", "Afrobeats Accra", "Black Sherif"],
  NG: ["Afrobeats", "Naija gospel", "Amapiano Lagos", "Burna Boy", "Asake"],
  ZA: ["Amapiano", "Gqom", "Johannesburg live", "Tyla"],
  JM: ["Dancehall", "Reggae", "Kingston"],
  US: ["Hip Hop", "R&B", "Gospel choir", "Country"],
  GB: ["UK drill", "Grime", "Afrobeats UK"],
  KR: ["K-pop", "K hip hop"],
  FR: ["Rap français", "Amapiano Paris"],
};

export const Route = createFileRoute("/_app/search")({
  validateSearch: searchSchema,
  component: SearchPage,
});

function SearchPage() {
  const { q: initial } = Route.useSearch();
  const [q, setQ] = useState(initial ?? "");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("songs");
  const [region, setRegion] = useState("US");
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    void getViewerGeo()
      .then((g) => {
        setRegion(g.region);
        setCity(g.city);
      })
      .catch(() => undefined);
  }, []);

  const chips = useMemo(() => {
    const local = LOCAL_CHIPS[region] ?? ["Afrobeats", "Gospel", "Hip Hop", "Pop", "Latin"];
    return city ? [`${city} hits`, ...local] : local;
  }, [region, city]);

  const catalog = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchCatalog({ data: q }),
    enabled: q.trim().length > 0,
  });
  const discover = useQuery({
    queryKey: ["discover-page", kind, q, region],
    queryFn: () => searchDiscover({ data: { q: `${q} ${region}`.trim(), kind } }),
    enabled: q.trim().length > 1,
  });
  const data = catalog.data;
  const videos = discover.data?.videos ?? [];
  const boomplay = discover.data?.boomplay ?? [];

  return (
    <div>
      <h1 className="font-display text-3xl">Search</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ranked with your region{city ? ` · ${city}` : ""} ({region}) in mind.
      </p>
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Songs, artists, genres, cities…"
          autoFocus
        />
      </form>
      <div className="mt-3 flex gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              "h-9 rounded-full px-3 text-xs capitalize",
              kind === k ? "bg-primary text-primary-foreground" : "bg-secondary",
            )}
          >
            {k}
          </button>
        ))}
      </div>
      {!q && (
        <div className="mt-8 flex flex-wrap gap-2">
          {chips.map((s) => (
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
      {q.trim().length > 0 && (
        <div className="mt-8 space-y-10">
          <section>
            <p className="text-xs tracking-widest text-sand uppercase">Near you · {region}</p>
            <h2 className="mb-3 font-display text-xl capitalize">{kind}</h2>
            {videos.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((v) => (
                  <YtVideoCard key={v.videoId} video={v} queue={videos} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {discover.isFetching ? "Searching your region…" : "No matches in that lane."}
              </p>
            )}
          </section>
          {boomplay.length > 0 && (
            <section>
              <p className="text-xs tracking-widest text-sand uppercase">VerzZify</p>
              <h2 className="mb-3 font-display text-xl">Popular on VerzZify</h2>
              {boomplay.map((t, i) => (
                <TrackRow key={t.id} track={t} queue={boomplay} index={i} />
              ))}
            </section>
          )}
          {data && (
            <>
              <section>
                <p className="text-xs tracking-widest text-sand uppercase">On VerzZify</p>
                <h2 className="mb-3 font-display text-xl">Catalog</h2>
                {data.tracks.map((t, i) => (
                  <TrackRow key={t.id} track={t} queue={data.tracks} index={i} />
                ))}
                {data.tracks.length === 0 && (
                  <p className="text-sm text-muted-foreground">No hosted tracks matched.</p>
                )}
              </section>
              {data.artists.length > 0 && (
                <div>
                  <h2 className="mb-3 font-display text-lg">Artists & producers</h2>
                  <div className="media-rail">
                    {data.artists.map((a) => (
                      <ArtistTile
                        key={a.id}
                        id={a.id}
                        slug={a.slug}
                        name={a.name}
                        avatarUrl={a.avatarUrl}
                        verified={a.verified}
                      />
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
