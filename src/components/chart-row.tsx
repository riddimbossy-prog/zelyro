import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import type { ChartArtistEntry, ChartDelta, ChartTrackEntry } from "@/lib/verzzify/types";
import { usePlayer } from "@/lib/verzzify/player";
import { cn, formatCount } from "@/lib/utils";

function Delta({ movement, delta }: { movement: ChartDelta; delta: number | null }) {
  if (movement === "new") {
    return <span className="w-8 text-center text-xs font-medium tracking-wide text-sand">NEW</span>;
  }
  if (movement === "same" || !delta) {
    return <span className="w-8 text-center text-muted-foreground">–</span>;
  }
  if (movement === "up") {
    return <span className="w-8 text-center text-xs font-medium tabular text-primary">▲{delta}</span>;
  }
  return <span className="w-8 text-center text-xs tabular text-muted-foreground">▼{Math.abs(delta)}</span>;
}

export function ChartTrackRow({
  entry,
  queue,
}: {
  entry: ChartTrackEntry;
  queue: ChartTrackEntry[];
}) {
  const play = usePlayer((s) => s.play);
  const currentId = usePlayer((s) => s.queue[s.index]?.id);
  const tracks = queue.map((e) => e.track);
  const index = tracks.findIndex((t) => t.id === entry.track.id);
  const active = currentId === entry.track.id;

  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-2 py-2 transition-[background-color,transform] duration-200 hover:bg-secondary md:grid-cols-[2.5rem_2rem_minmax(0,1fr)_3rem_3rem_3rem_5.5rem]",
        active && "bg-secondary",
        entry.gainer && "ring-1 ring-primary/40",
      )}
    >
      <button
        type="button"
        className="font-display text-lg tabular text-muted-foreground hover:text-foreground"
        onClick={() => play(tracks, Math.max(index, 0))}
        aria-label={`Play ${entry.track.title}`}
      >
        {entry.rank}
      </button>
      <Delta movement={entry.movement} delta={entry.delta} />
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" className="relative shrink-0" onClick={() => play(tracks, Math.max(index, 0))}>
          <img src={entry.track.coverUrl} alt="" className="size-12 rounded-md object-cover" />
          <span className="absolute inset-0 grid place-items-center rounded-md bg-background/40 opacity-0 hover:opacity-100">
            <Play className="size-4 fill-current" />
          </span>
        </button>
        <div className="min-w-0">
          <Link to="/track/$id" params={{ id: entry.track.id }} className="block truncate text-sm font-medium">
            {entry.track.title}
          </Link>
          <Link
            to="/artist/$slug"
            params={{ slug: entry.track.artistSlug }}
            className="block truncate text-xs text-muted-foreground"
          >
            {entry.track.artistName}
            {entry.track.country ? ` · ${entry.track.country}` : ""}
            {entry.gainer ? " · Greatest gainer" : ""}
          </Link>
        </div>
      </div>
      <p className="hidden text-right text-xs tabular text-muted-foreground md:block">
        {entry.previousRank ?? "–"}
      </p>
      <p className="hidden text-right text-xs tabular text-muted-foreground md:block">{entry.peak}</p>
      <p className="hidden text-right text-xs tabular text-muted-foreground md:block">{entry.weeksOn}</p>
      <p className="text-right text-xs tabular text-muted-foreground">{formatCount(entry.points)}</p>
    </div>
  );
}

export function ChartArtistRow({ entry }: { entry: ChartArtistEntry }) {
  return (
    <Link
      to="/artist/$slug"
      params={{ slug: entry.artist.slug }}
      className="grid grid-cols-[2rem_2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-2 py-2 hover:bg-secondary md:grid-cols-[2.5rem_2rem_minmax(0,1fr)_3rem_3rem_5.5rem]"
    >
      <span className="font-display text-lg tabular text-muted-foreground">{entry.rank}</span>
      <Delta movement={entry.movement} delta={entry.delta} />
      <div className="flex min-w-0 items-center gap-3">
        <img src={entry.artist.avatarUrl ?? "/favicon.svg"} alt="" className="size-12 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{entry.artist.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[entry.artist.city, entry.artist.country, entry.artist.genres].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <p className="hidden text-right text-xs tabular text-muted-foreground md:block">{entry.peak}</p>
      <p className="hidden text-right text-xs tabular text-muted-foreground md:block">{entry.weeksOn}</p>
      <p className="hidden text-right text-xs tabular text-muted-foreground md:block">{formatCount(entry.points)}</p>
    </Link>
  );
}
