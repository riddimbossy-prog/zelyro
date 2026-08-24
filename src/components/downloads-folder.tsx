import { useEffect, useState } from "react";
import { FolderDown, ListMusic, Play, Trash2, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useDownloads, formatBytes } from "@/lib/verzzify/downloads";
import { useLocalPlaylists } from "@/lib/verzzify/local-playlists";
import { usePlayer } from "@/lib/verzzify/player";
import { Button } from "@/components/ui/button";
import { cn, formatTime } from "@/lib/utils";
import { toast } from "sonner";

export function DownloadsFolder({ compact = false }: { compact?: boolean }) {
  const items = useDownloads((s) => s.items);
  const playlists = useLocalPlaylists((s) => s.items);
  const play = usePlayer((s) => s.play);
  const total = items.reduce((n, x) => n + x.bytes, 0);
  const queue = items.map((x) => x.track);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");

  useEffect(() => {
    void useLocalPlaylists.getState().hydrate();
  }, []);

  function togglePick(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createPlaylist() {
    const tracks = items.filter((x) => picked.has(x.id)).map((x) => x.track);
    if (!tracks.length) {
      toast("Pick at least one downloaded track");
      return;
    }
    const pl = await useLocalPlaylists.getState().create(name || "Offline mix", tracks);
    toast(`Playlist “${pl.title}” ready offline`);
    setSelecting(false);
    setPicked(new Set());
    setName("");
  }

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
              {" · plays offline in VerzZify"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.length > 0 && (
            <>
              <Button size="sm" onClick={() => play(queue, 0)}>
                <Play className="size-3.5 fill-current" /> Play all
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelecting((v) => !v);
                  setPicked(new Set());
                }}
              >
                <ListMusic className="size-3.5" />
                {selecting ? "Cancel" : "New playlist"}
              </Button>
            </>
          )}
          {compact && (
            <Button size="sm" variant="outline" asChild>
              <Link to="/library">Open folder</Link>
            </Button>
          )}
        </div>
      </div>

      {selecting && (
        <div className="mx-4 mb-3 flex flex-col gap-2 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 sm:flex-row sm:items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Playlist name"
            className="h-10 flex-1 rounded-xl border-0 bg-black/30 px-3 text-sm outline-none ring-1 ring-white/15 focus:ring-primary"
          />
          <Button size="sm" onClick={() => void createPlaylist()} disabled={picked.size === 0}>
            Save {picked.size ? `(${picked.size})` : ""}
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted-foreground">
          Download a track while you’re online. Files stay in this folder and keep playing through VerzZify offline — even when you leave the page.
        </p>
      ) : (
        <ul className={compact ? "px-3 pb-3" : "divide-y divide-border"}>
          {(compact ? items.slice(0, 6) : items).map((item, i) => {
            const on = picked.has(item.id);
            return (
              <li key={item.id} className="flex items-center gap-3 px-3 py-2">
                {selecting && (
                  <button
                    type="button"
                    aria-label={on ? "Deselect" : "Select"}
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full ring-1",
                      on ? "bg-primary text-primary-foreground ring-primary" : "bg-white/5 ring-white/20",
                    )}
                    onClick={() => togglePick(item.id)}
                  >
                    {on ? <Check className="size-4" /> : null}
                  </button>
                )}
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => (selecting ? togglePick(item.id) : play(queue, i))}
                >
                  <img src={item.coverUrl} alt="" className="size-12 rounded-lg object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.artistName} · {formatBytes(item.bytes)} · {formatTime(item.durationMs / 1000)}
                    </span>
                  </span>
                </button>
                {!compact && !selecting && (
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
            );
          })}
        </ul>
      )}

      {!compact && playlists.length > 0 && (
        <div className="border-t border-white/10 px-4 py-4">
          <p className="mb-3 text-[11px] font-extrabold tracking-[0.18em] text-primary uppercase">
            Offline playlists
          </p>
          <ul className="space-y-2">
            {playlists.map((pl) => (
              <li
                key={pl.id}
                className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/10"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => {
                    if (!pl.tracks.length) return;
                    play(pl.tracks, 0);
                  }}
                >
                  <img
                    src={pl.coverUrl ?? "/covers/night-market.jpg"}
                    alt=""
                    className="size-12 rounded-lg object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{pl.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {pl.tracks.length} tracks · offline
                    </span>
                  </span>
                </button>
                <Button size="sm" variant="outline" onClick={() => play(pl.tracks, 0)}>
                  <Play className="size-3.5 fill-current" />
                </Button>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                  aria-label={`Delete ${pl.title}`}
                  onClick={async () => {
                    await useLocalPlaylists.getState().remove(pl.id);
                    toast("Playlist removed");
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
