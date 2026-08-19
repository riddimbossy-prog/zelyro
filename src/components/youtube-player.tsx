import { ExternalLink, X } from "lucide-react";
import { useYtPlayer } from "@/lib/sheba/yt-player";
import { Button } from "@/components/ui/button";

export function YoutubePlayerOverlay() {
  const videoId = useYtPlayer((s) => s.videoId);
  const title = useYtPlayer((s) => s.title);
  const channel = useYtPlayer((s) => s.channel);
  const watchUrl = useYtPlayer((s) => s.watchUrl);
  const close = useYtPlayer((s) => s.close);
  if (!videoId) return null;
  const embed = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[24px] bg-card shadow-border">
        <div className="flex items-start justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.2em] text-sand uppercase">YouTube · official player</p>
            <p className="mt-1 truncate font-display text-lg">{title}</p>
            <p className="truncate text-xs text-muted-foreground">{channel}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary"
            aria-label="Close YouTube player"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="aspect-video bg-background">
          <iframe
            title={title ?? "YouTube"}
            src={embed}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Playback stays on YouTube. Sheba does not extract or store this video.
          </p>
          {watchUrl && (
            <Button asChild size="sm" variant="outline">
              <a href={watchUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" />
                Open on YouTube
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
