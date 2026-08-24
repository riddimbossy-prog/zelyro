import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { searchDiscover } from "@/lib/verzzify/promotions";
import { YtVideoCard } from "@/components/yt-video-card";
import { TrackRow } from "@/components/track-row";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const KINDS = [
  { id: "songs" as const, label: "Songs" },
  { id: "beats" as const, label: "Beats" },
  { id: "albums" as const, label: "Albums" },
];

export function VerzZifySearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("songs");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 320);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const query = useQuery({
    queryKey: ["discover", kind, debounced],
    queryFn: () => searchDiscover({ data: { q: debounced, kind } }),
    enabled: debounced.length > 1,
  });
  const videos = query.data?.videos ?? [];
  const promoted = query.data?.promoted ?? [];
  const boomplay = query.data?.boomplay ?? [];
  const showPanel = open && debounced.length > 1;

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
          placeholder="Search songs, beats, albums"
          className="h-11 rounded-full pr-10 pl-9"
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
            {query.isFetching ? "Searching…" : `${kind} · ${videos.length + promoted.length + boomplay.length} results`}
          </p>
          {boomplay.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-[10px] font-extrabold tracking-widest text-primary uppercase">Boomplay</p>
              {boomplay.map((t, i) => (
                <TrackRow key={t.id} track={t} queue={boomplay} index={i} />
              ))}
            </div>
          )}
          {promoted.length > 0 && (
            <ul className="mb-3 space-y-2">
              {promoted.map((p) => (
                <li key={p.campaignId}>
                  <YtVideoCard video={p.video} queue={[p.video, ...videos]} compact />
                </li>
              ))}
            </ul>
          )}
          {videos.length > 0 ? (
            <ul className="space-y-2">
              {videos.map((v) => (
                <li key={v.videoId}>
                  <YtVideoCard video={v} queue={videos} compact />
                </li>
              ))}
            </ul>
          ) : (
            !query.isFetching &&
            boomplay.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No matches. Try another title.</p>
          )}
        </div>
      )}
    </div>
  );
}
