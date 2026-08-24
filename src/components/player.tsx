import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import {
  Download,
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Share2,
  SkipBack,
  SkipForward,
  Video,
  Volume2,
  VolumeX,
  ChevronDown,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { usePlayer, getSpectrum } from "@/lib/verzzify/player";
import { layoutYtFrame, useYtPlayer } from "@/lib/verzzify/yt-player";
import { prettyArtistName } from "@/lib/verzzify/yt-charts";
import { toggleLike, purchaseTrack } from "@/lib/verzzify/queries";
import { useShareSheet } from "@/lib/verzzify/share";
import { useDownloads } from "@/lib/verzzify/downloads";
import { youtubeVideoToTrack } from "@/lib/verzzify/youtube";
import { cn, formatMoney, formatTime } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function MiniPlayer() {
  const audioTrack = usePlayer((s) => s.queue[s.index]);
  const ytId = useYtPlayer((s) => s.videoId);
  const ytTitle = useYtPlayer((s) => s.title);
  const ytChannel = useYtPlayer((s) => s.channel);
  const ytThumb = useYtPlayer((s) => s.thumbnailUrl);
  const ytPlaying = useYtPlayer((s) => s.isPlaying);
  const ytPos = useYtPlayer((s) => s.position);
  const ytDur = useYtPlayer((s) => s.duration);
  const audioPlaying = usePlayer((s) => s.isPlaying);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const audioToggle = usePlayer((s) => s.toggle);
  const audioNext = usePlayer((s) => s.next);
  const audioPrev = usePlayer((s) => s.prev);
  const setAudioExpanded = usePlayer((s) => s.setExpanded);
  const ytToggle = useYtPlayer((s) => s.toggle);
  const ytNext = useYtPlayer((s) => s.next);
  const ytPrev = useYtPlayer((s) => s.prev);
  const setYtExpanded = useYtPlayer((s) => s.setExpanded);

  const isYt = Boolean(ytId);
  if (!audioTrack && !isYt) return null;

  const isPlaying = isYt ? ytPlaying : audioPlaying;
  const pct = isYt
    ? ytDur
      ? (ytPos / ytDur) * 100
      : 0
    : duration
      ? (position / duration) * 100
      : 0;
  const title = isYt ? ytTitle : audioTrack?.title;
  const subtitle = isYt ? ytChannel : audioTrack?.artistName;
  const cover = isYt ? ytThumb : audioTrack?.coverUrl;
  const toggle = isYt ? ytToggle : audioToggle;
  const next = isYt ? ytNext : audioNext;
  const prev = isYt ? ytPrev : audioPrev;
  const expand = () => (isYt ? setYtExpanded(true) : setAudioExpanded(true));

  return (
    <div className="glass border-0">
      <div className="h-0.5 bg-white/10">
        <div className="h-full bg-primary transition-[width] duration-200 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button type="button" onClick={expand} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <img
            src={cover ?? ""}
            alt=""
            className={cn(
              "size-14 shrink-0 rounded-2xl object-cover ring-1 ring-white/20",
              isPlaying && !isYt && "disc-spin",
            )}
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{title}</span>
            <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
          </span>
        </button>
        <button type="button" className="grid size-10 place-items-center" onClick={prev} aria-label="Previous">
          <SkipBack className="size-4 fill-current" />
        </button>
        <button
          type="button"
          className="grid size-12 place-items-center rounded-full bg-white text-black"
          onClick={toggle}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 translate-x-px fill-current" />}
        </button>
        <button type="button" className="grid size-10 place-items-center" onClick={next} aria-label="Next">
          <SkipForward className="size-4 fill-current" />
        </button>
      </div>
    </div>
  );
}

function CoverEmbed({ videoId }: { videoId: string }) {
  useLayoutEffect(() => {
    layoutYtFrame();
    const onWin = () => layoutYtFrame();
    window.addEventListener("resize", onWin);
    return () => window.removeEventListener("resize", onWin);
  }, [videoId]);
  return (
    <div
      id="verzzify-cover-slot"
      className="relative size-56 overflow-hidden rounded-full bg-black shadow-lg ring-4 ring-primary/40 sm:size-72"
    />
  );
}

export function FullPlayer() {
  const audioExpanded = usePlayer((s) => s.expanded);
  const setAudioExpanded = usePlayer((s) => s.setExpanded);
  const track = usePlayer((s) => s.queue[s.index]);
  const audioPlaying = usePlayer((s) => s.isPlaying);
  const audioPos = usePlayer((s) => s.position);
  const audioDur = usePlayer((s) => s.duration);
  const audioVol = usePlayer((s) => s.volume);
  const audioMuted = usePlayer((s) => s.muted);
  const audioRepeat = usePlayer((s) => s.repeat);
  const audioToggle = usePlayer((s) => s.toggle);
  const audioNext = usePlayer((s) => s.next);
  const audioPrev = usePlayer((s) => s.prev);
  const audioSeek = usePlayer((s) => s.seek);
  const audioSetVolume = usePlayer((s) => s.setVolume);
  const audioToggleMute = usePlayer((s) => s.toggleMute);
  const audioCycleRepeat = usePlayer((s) => s.cycleRepeat);
  const patch = usePlayer((s) => s.patchTrack);
  const audioQueue = usePlayer((s) => s.queue);
  const audioIndex = usePlayer((s) => s.index);

  const ytExpanded = useYtPlayer((s) => s.expanded);
  const videoId = useYtPlayer((s) => s.videoId);
  const ytTitle = useYtPlayer((s) => s.title);
  const ytChannel = useYtPlayer((s) => s.channel);
  const ytThumb = useYtPlayer((s) => s.thumbnailUrl);
  const ytWatch = useYtPlayer((s) => s.watchUrl);
  const ytPlaying = useYtPlayer((s) => s.isPlaying);
  const ytPos = useYtPlayer((s) => s.position);
  const ytDur = useYtPlayer((s) => s.duration);
  const ytVol = useYtPlayer((s) => s.volume);
  const ytMuted = useYtPlayer((s) => s.muted);
  const ytRepeat = useYtPlayer((s) => s.repeat);
  const ytQueue = useYtPlayer((s) => s.queue);
  const ytIndex = useYtPlayer((s) => s.index);
  const ytToggle = useYtPlayer((s) => s.toggle);
  const ytNext = useYtPlayer((s) => s.next);
  const ytPrev = useYtPlayer((s) => s.prev);
  const ytSeek = useYtPlayer((s) => s.seek);
  const ytSetVolume = useYtPlayer((s) => s.setVolume);
  const ytToggleMute = useYtPlayer((s) => s.toggleMute);
  const ytCycleRepeat = useYtPlayer((s) => s.cycleRepeat);
  const setYtExpanded = useYtPlayer((s) => s.setExpanded);
  const openYtQueue = useYtPlayer((s) => s.openQueue);
  const playYtAt = useYtPlayer((s) => s.playAt);
  const radioLoading = useYtPlayer((s) => s.radioLoading);

  const showShare = useShareSheet((s) => s.show);
  const [bars, setBars] = useState<number[]>([]);

  const isYt = Boolean(videoId) && ytExpanded;
  const expanded = isYt || (audioExpanded && Boolean(track));
  const isPlaying = isYt ? ytPlaying : audioPlaying;
  const position = isYt ? ytPos : audioPos;
  const duration = isYt ? ytDur : audioDur;
  const volume = isYt ? ytVol : audioVol;
  const muted = isYt ? ytMuted : audioMuted;
  const repeat = isYt ? ytRepeat : audioRepeat;
  const title = isYt ? ytTitle : track?.title;
  const subtitle = isYt ? ytChannel : track?.artistName;
  const cover = isYt ? ytThumb : track?.coverUrl;
  const toggle = isYt ? ytToggle : audioToggle;
  const next = isYt ? ytNext : audioNext;
  const prev = isYt ? ytPrev : audioPrev;
  const seek = isYt ? ytSeek : audioSeek;
  const setVolume = isYt ? ytSetVolume : audioSetVolume;
  const toggleMute = isYt ? ytToggleMute : audioToggleMute;
  const cycleRepeat = isYt ? ytCycleRepeat : audioCycleRepeat;
  const collapse = () => (isYt ? setYtExpanded(false) : setAudioExpanded(false));

  useEffect(() => {
    if (!expanded || !isPlaying || isYt) return;
    let raf = 0;
    const tick = () => {
      setBars(getSpectrum());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [expanded, isPlaying, isYt]);

  if (!expanded) return null;

  const related = isYt
    ? ytQueue.filter((_, i) => i !== ytIndex)
    : audioQueue.filter((q) => q.id !== track?.id).slice(0, 6);
  const canDownload =
    !isYt &&
    track &&
    (track.distribution === "free_download" || track.purchased || track.distribution === "free_stream");

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background/80 backdrop-blur-2xl">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(70% 50% at 50% 0%, color-mix(in oklab, var(--glow-coral) 45%, transparent), transparent 70%),
            radial-gradient(50% 40% at 90% 80%, color-mix(in oklab, var(--glow-teal) 35%, transparent), transparent 70%)`,
        }}
      />
      <header className="relative flex items-center justify-between px-4 py-3">
        <button type="button" className="grid size-11 place-items-center" onClick={collapse} aria-label="Close player">
          <ChevronDown className="size-6" />
        </button>
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Now playing</p>
        <button
          type="button"
          className="grid size-11 place-items-center"
          aria-label="Share"
          onClick={() =>
            showShare({
              kind: "Song",
              title: title ?? "VerzZify",
              subtitle: subtitle ?? "",
              coverUrl: cover ?? "",
              url: isYt ? (ytWatch ?? window.location.origin) : `${window.location.origin}/track/${track?.id}`,
            })
          }
        >
          <Share2 className="size-5" />
        </button>
      </header>
      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-8 pb-10">
        <div className="relative mt-4">
          {isYt && videoId ? (
            <CoverEmbed videoId={videoId} />
          ) : (
            <>
              <span className="absolute -inset-3 rounded-full bg-primary/30 blur-xl" />
              <img
                src={cover ?? ""}
                alt=""
                className={cn(
                  "relative size-56 rounded-full object-cover shadow-lg ring-4 ring-primary/40 sm:size-72",
                  isPlaying && "disc-spin",
                )}
              />
            </>
          )}
        </div>
        <div className="mt-3 flex h-8 w-40 items-end justify-center gap-0.5">
          {(bars.length ? bars.slice(0, 20) : Array.from({ length: 20 }, (_, i) => 8 + (i % 7) * 3)).map((v, i) => (
            <span
              key={i}
              className="eq-bar w-1 rounded-full bg-primary/80"
              style={{
                height: `${Math.max(4, isYt ? 6 + ((i * 13) % 18) : (v / 255) * 32)}px`,
                animationPlayState: isPlaying ? "running" : "paused",
                animationDelay: `${i * 40}ms`,
              }}
            />
          ))}
        </div>
        <h2 className="mt-5 text-center font-display text-3xl font-medium">{title}</h2>
        {isYt ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : track ? (
          <Link
            to="/artist/$slug"
            params={{ slug: track.artistSlug }}
            className="mt-1 text-sm text-muted-foreground"
            onClick={() => setAudioExpanded(false)}
          >
            {track.artistName}
          </Link>
        ) : null}
        <label className="mt-6 w-full">
          <span className="sr-only">Seek</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={position}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <span className="mt-1 flex justify-between text-xs tabular">
            <span className="text-primary">{formatTime(position)}</span>
            <span className="text-muted-foreground">{formatTime(duration)}</span>
          </span>
        </label>
        <div className="mt-5 grid w-full grid-cols-5 gap-1 text-center text-[11px] text-muted-foreground">
          <Action
            icon={<Heart className={cn("size-5", !isYt && track?.liked && "fill-primary text-primary")} />}
            label="Like"
            onClick={async () => {
              if (isYt || !track) {
                toast("Saved on VerzZify");
                return;
              }
              try {
                const r = await toggleLike({ data: track.id });
                patch(track.id, { liked: r.liked });
              } catch {
                toast("Sign in to like tracks");
              }
            }}
          />
          <Action
            icon={<Video className="size-5" />}
            label="Video"
            onClick={() => {
              if (isYt) return;
              setAudioExpanded(false);
              if (track) window.location.href = `/artist/${track.artistSlug}`;
            }}
          />
          <Action
            icon={<ListMusic className="size-5" />}
            label="Playlist"
            onClick={async () => {
              if (isYt || !track) {
                toast("Queued on VerzZify");
                return;
              }
              try {
                await toggleLike({ data: track.id });
                toast("Saved to Liked Songs");
              } catch {
                toast("Sign in to save");
              }
            }}
          />
          <Action
            icon={<Download className="size-5" />}
            label="Download"
            onClick={async () => {
              if (isYt && videoId) {
                const current = ytQueue[ytIndex];
                if (!current) return;
                try {
                  await useDownloads.getState().saveTrack(youtubeVideoToTrack(current));
                  toast("Saved to Downloads — plays in VerzZify offline");
                } catch {
                  toast("Could not save this track");
                }
                return;
              }
              if (!track) return;
              if (!canDownload && (track.distribution === "paid_download" || track.distribution === "premium")) {
                try {
                  await purchaseTrack({
                    data: {
                      trackId: track.id,
                      license: track.distribution === "premium" ? "premium" : "basic",
                    },
                  });
                  patch(track.id, { purchased: true });
                  toast("Purchased — download unlocked");
                } catch {
                  toast("Sign in to buy this download");
                }
                return;
              }
              const a = document.createElement("a");
              a.href = track.audioUrl;
              a.download = `${track.title}.mp3`;
              a.click();
            }}
          />
          <Action
            icon={<Share2 className="size-5" />}
            label="Share"
            onClick={() =>
              showShare({
                kind: "Song",
                title: title ?? "VerzZify",
                subtitle: subtitle ?? "",
                coverUrl: cover ?? "",
                url: isYt ? (ytWatch ?? window.location.origin) : `${window.location.origin}/track/${track?.id}`,
              })
            }
          />
        </div>
        <div className="mt-6 flex w-full items-center justify-center gap-6">
          <button type="button" className="grid size-12 place-items-center" onClick={prev} aria-label="Previous">
            <SkipBack className="size-6 fill-current" />
          </button>
          <button
            type="button"
            className="fab-glow grid size-[4.5rem] place-items-center rounded-full border-2 border-primary bg-primary text-primary-foreground"
            onClick={toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="size-7 fill-current" /> : <Play className="size-7 translate-x-0.5 fill-current" />}
          </button>
          <button type="button" className="grid size-12 place-items-center" onClick={next} aria-label="Next">
            <SkipForward className="size-6 fill-current" />
          </button>
          <button
            type="button"
            className={cn("grid size-11 place-items-center", repeat !== "off" && "text-primary")}
            onClick={cycleRepeat}
            aria-label="Repeat"
          >
            <Repeat className="size-4" />
          </button>
        </div>
        <div className="mt-4 flex w-full items-center gap-3">
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
        {!isYt && track && (track.distribution === "paid_download" || track.distribution === "premium") && !track.purchased && (
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
        {related.length > 0 && (
          <div className="mt-10 w-full">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold tracking-[0.22em] text-primary uppercase">
                  {isYt ? "Artist radio" : "Up next"}
                </p>
                <p className="font-display text-2xl">{isYt ? `More from ${prettyArtistName(ytChannel ?? "")}` : "Related Songs"}</p>
              </div>
              {isYt && ytQueue.length > 1 && (
                <button
                  type="button"
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black"
                  onClick={next}
                >
                  Play next
                </button>
              )}
            </div>
            {isYt && radioLoading && <p className="mb-3 text-xs text-muted-foreground">Loading the rest of the set…</p>}
            <ul className="space-y-2">
              {isYt
                ? ytQueue.map((q, i) => (
                    <li key={q.videoId}>
                      <MoreRow
                        n={i + 1}
                        active={i === ytIndex}
                        playing={i === ytIndex && isPlaying}
                        cover={q.thumbnailUrl}
                        title={q.title}
                        subtitle={prettyArtistName(q.channelName)}
                        onPlay={() => playYtAt(i)}
                        onDownload={async () => {
                          try {
                            await useDownloads.getState().saveTrack(youtubeVideoToTrack(q));
                            toast("Saved to Downloads");
                          } catch {
                            toast("Download failed");
                          }
                        }}
                      />
                    </li>
                  ))
                : related.map((q, i) => {
                    if (!("id" in q)) return null;
                    return (
                      <li key={q.id}>
                        <MoreRow
                          n={i + 1}
                          active={q.id === track?.id}
                          playing={q.id === track?.id && isPlaying}
                          cover={q.coverUrl}
                          title={q.title}
                          subtitle={q.artistName}
                          onPlay={() => usePlayer.getState().play(audioQueue, audioQueue.findIndex((x) => x.id === q.id))}
                          onDownload={async () => {
                            try {
                              await useDownloads.getState().saveTrack(q);
                              toast("Saved to Downloads");
                            } catch {
                              toast("Download failed");
                            }
                          }}
                        />
                      </li>
                    );
                  })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function MoreRow({
  n,
  active,
  playing,
  cover,
  title,
  subtitle,
  onPlay,
  onDownload,
}: {
  n: number;
  active: boolean;
  playing: boolean;
  cover: string;
  title: string;
  subtitle: string;
  onPlay: () => void;
  onDownload: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl px-2 py-2 ring-1",
        active ? "bg-primary/20 ring-primary/50" : "bg-white/5 ring-white/10",
      )}
    >
      <button type="button" onClick={onPlay} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="w-5 text-center text-xs tabular text-muted-foreground">{n}</span>
        <span className="relative size-12 shrink-0">
          <img src={cover} alt="" className="size-12 rounded-full object-cover ring-2 ring-white/20" />
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45">
            {playing ? <Pause className="size-4 fill-white text-white" /> : <Play className="size-4 translate-x-px fill-white text-white" />}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-sm font-semibold", active && "text-primary")}>{title}</span>
          <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
        </span>
      </button>
      <button
        type="button"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10"
        aria-label={`Download ${title}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDownload();
        }}
      >
        <Download className="size-4" />
      </button>
    </div>
  );
}

function Action({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1 py-1">
      {icon}
      {label}
    </button>
  );
}
