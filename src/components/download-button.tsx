import { Check, Download, LoaderCircle } from "lucide-react";
import type { TrackCard } from "@/lib/verzzify/types";
import { useDownloads } from "@/lib/verzzify/downloads";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function DownloadButton({
  track,
  className,
}: {
  track: TrackCard;
  className?: string;
}) {
  const saved = useDownloads((s) => s.items.some((x) => x.id === track.id));
  const pct = useDownloads((s) => s.progress[track.id] ?? 0);
  const busy = pct > 0 && pct < 100 && !saved;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs",
        saved ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
        className,
      )}
      aria-label={saved ? "In Downloads" : `Download ${track.title}`}
      disabled={busy}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (saved) {
          toast("Already in Downloads");
          return;
        }
        try {
          await useDownloads.getState().saveTrack(track);
          toast("Saved to Downloads — plays in VerzZify offline");
        } catch {
          toast("Could not save this file");
        }
      }}
    >
      {busy ? (
        <LoaderCircle className="size-3.5 animate-spin" />
      ) : saved ? (
        <Check className="size-3.5" />
      ) : (
        <Download className="size-3.5" />
      )}
      {busy ? `${pct}%` : saved ? "Downloaded" : "Download"}
    </button>
  );
}
