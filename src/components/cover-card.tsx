import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import type { TrackCard } from "@/lib/verzzify/types";
import { usePlayer } from "@/lib/verzzify/player";
import { cn } from "@/lib/utils";
import { DownloadButton } from "@/components/download-button";
import { FollowButton } from "@/components/follow-button";

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
        className="cover-shine zz-tick relative block w-full overflow-hidden rounded-2xl bg-secondary"
        aria-label={`Play ${track.title}`}
      >
        <img
          src={track.coverUrl}
          alt=""
          className="aspect-square w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
        <span className="absolute right-2.5 bottom-2.5 grid size-10 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-md transition-[opacity,transform] duration-200 ease-out group-hover:scale-100 group-hover:opacity-100">
          <Play className="size-4 translate-x-px fill-current" />
        </span>
      </button>
      <Link
        to="/track/$id"
        params={{ id: track.id }}
        className="mt-2.5 block truncate text-base font-semibold leading-tight text-foreground"
      >
        {track.title}
      </Link>
      <Link
        to="/artist/$slug"
        params={{ slug: track.artistSlug }}
        className="block truncate text-sm text-muted-foreground"
      >
        {subtitle ?? track.artistName}
      </Link>
      <div className="mt-2">
        <DownloadButton track={track} />
      </div>
    </article>
  );
}

export function ArtistTile({
  id,
  slug,
  name,
  avatarUrl,
  verified,
  followed = false,
}: {
  id?: string;
  slug: string;
  name: string;
  avatarUrl: string | null;
  verified?: boolean;
  followed?: boolean;
}) {
  return (
    <div className="group min-w-0 text-center">
      <Link to="/artist/$slug" params={{ slug }} className="block">
        <span className="cover-shine mx-auto block overflow-hidden rounded-full">
          <img
            src={avatarUrl ?? "/favicon.svg"}
            alt=""
            className="aspect-square w-full rounded-full object-cover"
          />
        </span>
        <p className={cn("mt-2 truncate text-sm font-medium", verified && "text-foreground")}>
          {name}
        </p>
      </Link>
      {id && (
        <div className="mt-2 flex justify-center">
          <FollowButton artistId={id} artistName={name} initial={followed} size="sm" />
        </div>
      )}
    </div>
  );
}
