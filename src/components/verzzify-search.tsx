import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { searchDiscover } from "@/lib/verzzify/promotions";
import type { YouTubeVideo } from "@/lib/verzzify/types";
import { YtVideoCard } from "@/components/yt-video-card";
import { TrackRow } from "@/components/track-row";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const KINDS = [
  { id: "songs" as const, label: "Songs" },
  { id: "beats" as const, label: "Beats" },
  { id: "albums" as const, label: "Albums" },
];

async function fetchYoutube(q: string, region: string): Promise<YouTubeVideo[]> {
  const res = await fetch(
    `/api/v1/youtube?q=${encodeURIComponent(q)}&region=${encodeURIComponent(region)}`,
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { videos?: YouTubeVideo[] };
  return json.videos ?? [];
}

function buildYtQuery(q: string, kind: (typeof KINDS)[number]["id"]): string {
  const base = q.trim();
  if (!base) return "";
  if (kind === "beats") return `${base} type beat instrumental`;
  if (kind === "albums") return `${base} full album`;
  return base;
}

export function VerzZifySearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("songs");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState("US");
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 320);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    void import("@/lib/verzzify/geo")
      .then(({ getViewerGeo }) => getViewerGeo())
      .then((g) => setRegion(g.region))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const ytQ = buildYtQuery(debounced, kind);

  // Primary: live YouTube Data API (same as youtube.com search)
  const youtube = useQuery({
    queryKey: ["header-yt", ytQ, region],
    queryFn: () => fetchYoutube(ytQ, region),
    enabled: ytQ.length > 1,
    staleTime: 60_000,
  });

  // Secondary: promoted + Boomplay catalog
  const extra = useQuery({
    queryKey: ["header-discover", kind, debounced],
    queryFn: () => searchDiscover({ data: { q: debounced, kind } }),
    enabled: debounced.length > 1,
  });

  const videos = youtube.data ?? [];
  const promoted = extra.data?.promoted ?? [];
  const boomplay = extra.data?.boomplay ?? [];
  const showPanel = open && debounced.length > 1;
  const total = videos.length + promoted.length + boomplay.length;

  return (
    <div ref={wrap} className="relative min-w-0 flex-1">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search YouTube — songs, artists, or paste a link"
          className="h-11 rounded-full pr-10 pl-9"
          aria-label="Search YouTube on VerzZify"
        />
        {q && (
          <button
            type="button"
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground"
            onClick={() => {
              setQ("");
              setOpen(false);
            }}
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <div className={cn("mt-2 flex gap-1.5", !open && "hidden")}>
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => {
              setKind(k.id);
              setOpen(true);
            }}
            className={cn(
              "h-8 rounded-full px-3 text-xs",
              kind === k.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>
      {showPanel && (
        <div className="glass absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 max-h-[min(28rem,70dvh)] overflow-y-auto rounded-2xl p-3 shadow-lg">
          <p className="mb-2 text-xs text-muted-foreground">
            {youtube.isFetching && videos.length === 0
              ? "Searching YouTube…"
              : `${kind} · ${total} results · ${region}`}
          </p>

          {videos.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-[10px] font-extrabold tracking-widest text-primary uppercase">
                YouTube
              </p>
              <ul className="space-y-2">
                {videos.map((v) => (
                  <li key={v.videoId}>
                    <YtVideoCard video={v} queue={videos} compact />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {promoted.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-[10px] font-extrabold tracking-widest text-sand uppercase">
                Promoted
              </p>
              <ul className="space-y-2">
                {promoted.map((p) => (
                  <li key={p.campaignId}>
                    <YtVideoCard video={p.video} queue={[p.video, ...videos]} compact />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {boomplay.length > 0 && (
            <div className="mb-1">
              <p className="mb-1 text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">
                On VerzZify
              </p>
              {boomplay.map((t, i) => (
                <TrackRow key={t.id} track={t} queue={boomplay} index={i} />
              ))}
            </div>
          )}

          {!youtube.isFetching && total === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No YouTube matches. Try another title or paste a video URL.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
