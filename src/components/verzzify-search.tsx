import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Play, Search, X } from "@/components/icons";
import { searchDiscover } from "@/lib/verzzify/promotions";
import type { YouTubeVideo } from "@/lib/verzzify/types";
import { useYtPlayer } from "@/lib/verzzify/yt-player";
import { TrackRow } from "@/components/track-row";
import { Input } from "@/components/ui/input";
import { cn, formatCount } from "@/lib/utils";

const KINDS = [
  { id: "songs" as const, label: "Songs" },
  { id: "beats" as const, label: "Beats" },
  { id: "albums" as const, label: "Albums" },
];

async function fetchYoutube(q: string, region: string): Promise<YouTubeVideo[]> {
  const res = await fetch(
    `/api/v1/youtube?q=${encodeURIComponent(q)}&region=${encodeURIComponent(region)}`,
  );
  if (!res.ok) throw new Error("search failed");
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

function ResultRow({
  video,
  queue,
  index,
}: {
  video: YouTubeVideo;
  queue: YouTubeVideo[];
  index: number;
}) {
  const openQueue = useYtPlayer((s) => s.openQueue);
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
      <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{index + 1}</span>
      <button
        type="button"
        onClick={() => openQueue(queue, index)}
        className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-secondary"
        aria-label={`Play ${video.title}`}
      >
        <img src={video.thumbnailUrl} alt="" className="size-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
          <Play className="size-4 fill-white text-white" />
        </span>
      </button>
      <button
        type="button"
        onClick={() => openQueue(queue, index)}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-sm font-medium text-foreground">{video.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {video.channelName}
          {video.viewCount != null ? ` · ${formatCount(video.viewCount)} views` : ""}
          {" · YouTube"}
        </p>
      </button>
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase hover:bg-white/15 hover:text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        YouTube
      </a>
    </div>
  );
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
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open || debounced.length <= 1) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, debounced]);

  const ytQ = buildYtQuery(debounced, kind);

  const youtube = useQuery({
    queryKey: ["header-yt", ytQ, region],
    queryFn: () => fetchYoutube(ytQ, region),
    enabled: ytQ.length > 1,
    staleTime: 60_000,
  });

  const extra = useQuery({
    queryKey: ["header-discover", kind, debounced],
    queryFn: () => searchDiscover({ data: { q: debounced, kind } }),
    enabled: debounced.length > 1,
  });

  const videos = youtube.data ?? [];
  const boomplay = extra.data?.boomplay ?? [];
  const showPanel = open && debounced.length > 1;
  const total = videos.length + boomplay.length;

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
          onKeyDown={(e) => {
            if (e.key === "Enter" && q.trim()) setOpen(true);
          }}
          placeholder="Search songs, artists, albums…"
          className="h-11 rounded-full border border-white/15 bg-[#1a0b2e] pr-10 pl-9 text-foreground"
          aria-label="Search VerzZify"
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
              "h-8 rounded-full px-3 text-xs font-medium",
              kind === k.id
                ? "bg-primary text-primary-foreground"
                : "bg-[#2a1840] text-foreground",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      {showPanel && (
        <>
          <button
            type="button"
            aria-label="Close search"
            className="fixed inset-0 z-40 bg-black/75"
            onClick={() => setOpen(false)}
          />

          <div
            className="fixed inset-x-0 top-[4.5rem] z-50 mx-auto max-h-[min(32rem,72dvh)] w-[min(100%,36rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#140a22] shadow-2xl sm:left-auto sm:right-4 md:right-8"
            role="listbox"
            aria-label="Search results"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {youtube.isFetching && videos.length === 0
                    ? "Searching…"
                    : `${total} result${total === 1 ? "" : "s"}`}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  VerzZify · {region} · {kind}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/search"
                  search={{ q: debounced }}
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/15"
                >
                  Full page
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid size-8 place-items-center rounded-full bg-white/10 text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[min(26rem,60dvh)] overflow-y-auto px-2 py-2">
              {videos.length > 0 && (
                <div className="mb-2">
                  <p className="px-2 py-1 text-[10px] font-bold tracking-widest text-primary uppercase">
                    From YouTube
                  </p>
                  {videos.map((v, i) => (
                    <ResultRow key={v.videoId} video={v} queue={videos} index={i} />
                  ))}
                </div>
              )}

              {boomplay.length > 0 && (
                <div className="border-t border-white/10 pt-2">
                  <p className="px-2 py-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    On VerzZify
                  </p>
                  {boomplay.map((t, i) => (
                    <TrackRow key={t.id} track={t} queue={boomplay} index={i} />
                  ))}
                </div>
              )}

              {!youtube.isFetching && total === 0 && (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No matches for “{debounced}”. Try another spelling.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
