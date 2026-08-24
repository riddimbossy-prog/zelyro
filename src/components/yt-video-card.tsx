import { Play } from "@/components/icons";
import type { YouTubeVideo } from "@/lib/verzzify/types";
import { useYtPlayer } from "@/lib/verzzify/yt-player";
import { youtubeVideoToTrack } from "@/lib/verzzify/youtube";
import { DownloadButton } from "@/components/download-button";
import { cn, formatCount } from "@/lib/utils";
import { toast } from "sonner";

export function YtVideoCard({
  video,
  queue,
  compact = false,
}: {
  video: YouTubeVideo;
  queue: YouTubeVideo[];
  compact?: boolean;
}) {
  const openQueue = useYtPlayer((s) => s.openQueue);

  function play() {
    if (!navigator.onLine) {
      toast("Needs a connection. Download VerzZify tracks to play offline.");
      return;
    }
    const idx = queue.findIndex((v) => v.videoId === video.videoId);
    if (idx >= 0) openQueue(queue, idx);
    else openQueue([video, ...queue], 0);
  }

  return (
    <article className={cn("group min-w-0", compact && "flex gap-3")}>
      <button
        type="button"
        onClick={play}
        className={cn(
          "cover-shine relative block overflow-hidden rounded-2xl bg-secondary",
          compact ? "w-32 shrink-0" : "w-full",
        )}
        aria-label={`Play ${video.title}`}
      >
        <img src={video.thumbnailUrl} alt="" className="aspect-video w-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-background/25 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
            <Play className="size-4 translate-x-px fill-current" />
          </span>
        </span>
        <span className="absolute right-2 bottom-2 rounded bg-background/80 px-1.5 py-0.5 text-xs">
          Play
        </span>
      </button>
      <div className={cn("min-w-0", compact ? "flex-1 py-0.5" : "mt-2")}>
        <p className="truncate text-sm font-medium">{video.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {video.channelName}
          {video.viewCount ? ` · ${formatCount(video.viewCount)} views` : ""}
        </p>
        <div className="mt-2">
          <DownloadButton track={youtubeVideoToTrack(video)} />
        </div>
      </div>
    </article>
  );
}
