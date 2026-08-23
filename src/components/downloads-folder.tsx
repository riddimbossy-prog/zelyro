import { FolderDown, Play, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useDownloads, formatBytes } from "@/lib/verzzify/downloads";
import { usePlayer } from "@/lib/verzzify/player";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import { toast } from "sonner";

export function DownloadsFolder({ compact = false }: { compact?: boolean }) {
  const items = useDownloads((s) => s.items);
  const play = usePlayer((s) => s.play);
  const total = items.reduce((n, x) => n + x.bytes, 0);
  const queue = items.map((x) => x.track);

  return (
    <section className="glass overflow-hidden rounded-[28px]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-secondary text-sand">
            <FolderDown className="size-5" />
          </span>
          <div>
            <p className="font-display text-xl">Downloads</p>
            <p className="text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? "file" : "files"}
              {total ? ` · ${formatBytes(total)}` : ""}
              {" · plays in VerzZify offline"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {items.length > 0 && (
            <Button size="sm" onClick={() => play(queue, 0)}>
              <Play className="size-3.5 fill-current" /> Play all
            </Button>
          )}
          {compact && (
            <Button size="sm" variant="outline" asChild>
              <Link to="/library">Open folder</Link>
            </Button>
          )}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted-foreground">
          Download a VerzZify track while you’re online. The file lives in this folder and replays through VerzZify when you’re offline.
        </p>
      ) : (
        <ul className={compact ? "px-3 pb-3" : "divide-y divide-border"}>
          {(compact ? items.slice(0, 6) : items).map((item, i) => (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() => play(queue, i)}
              >
                <img src={item.coverUrl} alt="" className="size-12 rounded-lg object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.artistName} · {formatBytes(item.bytes)} · {formatTime(item.durationMs / 1000)}
                  </span>
                </span>
              </button>
              {!compact && (
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${item.title}`}
                  onClick={async () => {
                    await useDownloads.getState().remove(item.id);
                    toast("Removed from Downloads");
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
