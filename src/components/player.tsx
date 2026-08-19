import { useEffect, useState } from "react";
import {
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { usePlayer, getSpectrum } from "@/lib/zelyro/player";
import { toggleLike, purchaseTrack } from "@/lib/zelyro/queries";
import { cn, formatMoney, formatTime } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function MiniPlayer() {
  const track = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const setExpanded = usePlayer((s) => s.setExpanded);
  if (!track) return null;
  const pct = duration ? (position / duration) * 100 : 0;

  return (
    <div className="border-t border-border bg-card">
      <div className="h-0.5 bg-secondary">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center gap-3 px-3 py-2">
        <button type="button" onClick={() => setExpanded(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <img src={track.coverUrl} alt="" className="size-12 rounded-lg object-cover" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{track.title}</span>
            <span className="block truncate text-xs text-muted-foreground">{track.artistName}</span>
          </span>
        </button>
        <button type="button" className="hidden size-11 place-items-center sm:grid" onClick={prev} aria-label="Previous">
          <SkipBack className="size-4 fill-current" />
        </button>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full bg-foreground text-background"
          onClick={toggle}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 translate-x-px fill-current" />
          )}
        </button>
        <button type="button" className="grid size-11 place-items-center" onClick={next} aria-label="Next">
          <SkipForward className="size-4 fill-current" />
        </button>
      </div>
    </div>
  );
}

export function FullPlayer() {
  const expanded = usePlayer((s) => s.expanded);
  const setExpanded = usePlayer((s) => s.setExpanded);
  const track = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const patch = usePlayer((s) => s.patchTrack);
  const queue = usePlayer((s) => s.queue);
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    if (!expanded || !isPlaying) return;
    let raf = 0;
    const tick = () => {
      setBars(getSpectrum());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [expanded, isPlaying]);

  if (!expanded || !track) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(80% 50% at 50% 0%, color-mix(in oklab, var(--accent) 35%, transparent), transparent)`,
        }}
      />
      <header className="relative flex items-center justify-between px-4 py-3">
        <button type="button" className="grid size-11 place-items-center" onClick={() => setExpanded(false)} aria-label="Close player">
          <X className="size-5" />
        </button>
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Now playing</p>
        <Link to="/track/$id" params={{ id: track.id }} className="grid size-11 place-items-center" onClick={() => setExpanded(false)}>
          <ListMusic className="size-5" />
        </Link>
      </header>
      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-8 pb-8">
        <img
          src={track.coverUrl}
          alt=""
          className="aspect-square w-full max-w-sm rounded-3xl object-cover shadow-lg"
        />
        <div className="mt-4 flex h-10 w-full items-end justify-center gap-0.5">
          {(bars.length ? bars.slice(0, 24) : Array.from({ length: 24 }, () => 8)).map((v, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full bg-primary/80"
              style={{ height: `${Math.max(4, (v / 255) * 40)}px` }}
            />
          ))}
        </div>
        <div className="mt-6 flex w-full items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-medium">{track.title}</h2>
            <Link
              to="/artist/$slug"
              params={{ slug: track.artistSlug }}
              className="text-sm text-muted-foreground"
              onClick={() => setExpanded(false)}
            >
              {track.artistName}
            </Link>
          </div>
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center"
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
            <Heart className={cn("size-5", track.liked && "fill-primary text-primary")} />
          </button>
        </div>
        <label className="mt-6 w-full">
          <span className="sr-only">Seek</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={position}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <span className="mt-1 flex justify-between text-xs text-muted-foreground tabular">
            <span>{formatTime(position)}</span>
            <span>{formatTime(duration)}</span>
          </span>
        </label>
        <div className="mt-4 flex w-full items-center justify-between">
          <button type="button" className={cn("grid size-11 place-items-center", shuffle && "text-primary")} onClick={toggleShuffle} aria-label="Shuffle">
            <Shuffle className="size-4" />
          </button>
          <button type="button" className="grid size-12 place-items-center" onClick={prev} aria-label="Previous">
            <SkipBack className="size-6 fill-current" />
          </button>
          <button
            type="button"
            className="grid size-16 place-items-center rounded-full bg-foreground text-background"
            onClick={toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="size-6 fill-current" /> : <Play className="size-6 translate-x-0.5 fill-current" />}
          </button>
          <button type="button" className="grid size-12 place-items-center" onClick={next} aria-label="Next">
            <SkipForward className="size-6 fill-current" />
          </button>
          <button type="button" className={cn("grid size-11 place-items-center", repeat !== "off" && "text-primary")} onClick={cycleRepeat} aria-label="Repeat">
            <Repeat className="size-4" />
          </button>
        </div>
        <div className="mt-6 flex w-full items-center gap-3">
          <button type="button" onClick={toggleMute} aria-label="Mute" className="grid size-9 place-items-center">
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
        </div>
        {(track.distribution === "paid_download" || track.distribution === "premium") && !track.purchased && (
          <Button
            className="mt-6 w-full"
            onClick={async () => {
              try {
                const r = await purchaseTrack({
                  data: {
                    trackId: track.id,
                    license: track.distribution === "premium" ? "premium" : "basic",
                  },
                });
                patch(track.id, { purchased: true });
                toast(r.already ? "Already in your library" : "Purchase complete — added to library");
              } catch {
                toast("Sign in to buy this track");
              }
            }}
          >
            Buy {formatMoney(track.priceCents, track.currency)}
          </Button>
        )}
        {queue.length > 1 && (
          <div className="mt-8 w-full">
            <p className="mb-2 text-xs tracking-widest text-muted-foreground uppercase">Queue</p>
            <ul className="max-h-40 space-y-1 overflow-auto">
              {queue.map((q, i) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => usePlayer.getState().play(queue, i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm",
                      q.id === track.id && "bg-secondary",
                    )}
                  >
                    <img src={q.coverUrl} alt="" className="size-8 rounded object-cover" />
                    <span className="min-w-0 truncate">{q.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
