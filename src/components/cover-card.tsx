import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import type { TrackCard } from "@/lib/zelyro/types";
import { usePlayer } from "@/lib/zelyro/player";
import { cn } from "@/lib/utils";

export function CoverCard({
  track,
  queue,
  subtitle,
}: {
  track: TrackCard;
  queue: TrackCard[];
  subtitle?: string;
}) {
  const play = usePlayer((s) => s.play);
  const index = queue.findIndex((t) => t.id === track.id);
  return (
    <article className="group min-w-0">
      <button
        type="button"
        onClick={() => play(queue, Math.max(index, 0))}
        className="relative block w-full overflow-hidden rounded-2xl bg-secondary"
        aria-label={`Play ${track.title}`}
      >
        <img
          src={track.coverUrl}
          alt=""
          className="aspect-square w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
        <span className="absolute right-2.5 bottom-2.5 grid size-10 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
          <Play className="size-4 translate-x-px fill-current" />
        </span>
      </button>
      <Link
        to="/track/$id"
        params={{ id: track.id }}
        className="mt-2.5 block truncate text-sm font-medium text-foreground"
      >
        {track.title}
      </Link>
      <Link
        to="/artist/$slug"
        params={{ slug: track.artistSlug }}
        className="block truncate text-xs text-muted-foreground"
      >
        {subtitle ?? track.artistName}
      </Link>
    </article>
  );
}

export function ArtistTile({
  slug,
  name,
  avatarUrl,
  verified,
}: {
  slug: string;
  name: string;
  avatarUrl: string | null;
  verified?: boolean;
}) {
  return (
    <Link to="/artist/$slug" params={{ slug }} className="group min-w-0 text-center">
      <img
        src={avatarUrl ?? "/favicon.svg"}
        alt=""
        className="mx-auto aspect-square w-full rounded-full object-cover"
      />
      <p className={cn("mt-2 truncate text-sm font-medium", verified && "text-foreground")}>
        {name}
      </p>
    </Link>
  );
}
