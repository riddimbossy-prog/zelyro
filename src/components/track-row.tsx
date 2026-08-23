import { Heart, Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { TrackCard } from "@/lib/verzzify/types";
import { usePlayer } from "@/lib/verzzify/player";
import { toggleLike } from "@/lib/verzzify/queries";
import { cn, formatCount, formatTime } from "@/lib/utils";
import { toast } from "sonner";
import { DownloadButton } from "@/components/download-button";

export function TrackRow({
  track,
  queue,
  index,
  showArtist = true,
}: {
  track: TrackCard;
  queue: TrackCard[];
  index: number;
  showArtist?: boolean;
}) {
  const play = usePlayer((s) => s.play);
  const currentId = usePlayer((s) => s.queue[s.index]?.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const patch = usePlayer((s) => s.patchTrack);
  const active = currentId === track.id;

  return (
    <div
      className={cn(
        "group grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-2 hover:bg-secondary md:grid-cols-[28px_minmax(0,1fr)_120px_80px_auto]",
        active && "bg-secondary",
      )}
    >
      <button
        type="button"
        className="grid size-7 place-items-center text-muted-foreground"
        onClick={() => play(queue, index)}
        aria-label={`Play ${track.title}`}
      >
        {active && isPlaying ? (
          <span className="flex h-3 items-end gap-px">
            <i className="inline-block h-2 w-0.5 animate-pulse bg-primary" />
            <i className="inline-block h-3 w-0.5 animate-pulse bg-primary [animation-delay:120ms]" />
            <i className="inline-block h-1.5 w-0.5 animate-pulse bg-primary [animation-delay:240ms]" />
          </span>
        ) : (
          <>
            <span className="text-xs tabular group-hover:hidden">{index + 1}</span>
            <Play className="hidden size-3.5 fill-current group-hover:block" />
          </>
        )}
      </button>
      <div className="flex min-w-0 items-center gap-3">
        <img src={track.coverUrl} alt="" className="size-10 rounded-md object-cover" />
        <div className="min-w-0">
          <Link
            to="/track/$id"
            params={{ id: track.id }}
            className={cn("block truncate text-base font-semibold leading-tight", active && "text-primary")}
          >
            {track.title}
          </Link>
          {showArtist && (
            <Link
              to="/artist/$slug"
              params={{ slug: track.artistSlug }}
              className="block truncate text-sm leading-tight text-muted-foreground"
            >
              {track.artistName}
            </Link>
          )}
        </div>
      </div>
      <p className="hidden truncate text-xs text-muted-foreground md:block">
        {formatCount(track.playCount)} plays
      </p>
      <p className="hidden text-xs text-muted-foreground tabular md:block">
        {formatTime(track.durationMs / 1000)}
      </p>
      <div className="flex items-center gap-1">
        <DownloadButton track={track} className="hidden sm:inline-flex" />
        <button
          type="button"
          className="grid size-9 place-items-center text-muted-foreground hover:text-foreground"
          aria-label="Like"
          onClick={async () => {
            try {
              const r = await toggleLike({ data: track.id });
              patch(track.id, { liked: r.liked });
            } catch {
              toast("Sign in to like tracks");
            }
          }}
        >
          <Heart
            className={cn("size-4", track.liked && "fill-primary text-primary")}
          />
        </button>
      </div>
    </div>
  );
}
