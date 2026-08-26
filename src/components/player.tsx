import { useLayoutEffect, type ReactNode } from "react";
import {
  Download,
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Video,
  Volume2,
  VolumeX,
  ChevronDown,
} from "@/components/icons";
import { Link } from "@tanstack/react-router";
import { usePlayer } from "@/lib/verzzify/player";
import { layoutYtFrame, useYtPlayer } from "@/lib/verzzify/yt-player";
import { prettyArtistName } from "@/lib/verzzify/yt-charts";
import { toggleLike, purchaseTrack } from "@/lib/verzzify/queries";
import { useShareSheet, shareTrackUrl, shareWatchUrl } from "@/lib/verzzify/share";
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
  const setAudioExpanded = usePlayer((s) => s.setExpanded);
  const ytToggle = useYtPlayer((s) => s.toggle);
  const setYtExpanded = useYtPlayer((s) => s.setExpanded);

  const isYt = Boolean(ytId) && !(audioTrack && audioPlaying);
  if (!audioTrack && !isYt) return null;

  const isPlaying = isYt ? ytPlaying : audioPlaying;
  const pct = isYt ? (ytDur ? (ytPos / ytDur) * 100 : 0) : duration ? (position / duration) * 100 : 0;
  const title = isYt ? ytTitle : audioTrack?.title;
  const subtitle = isYt ? ytChannel : audioTrack?.artistName;
  const cover = isYt ? ytThumb : audioTrack?.coverUrl;
  const toggle = isYt ? ytToggle : audioToggle;
  const expand = () => (isYt ? setYtExpanded(true) : setAudioExpanded(true));

  return (
    <div className="glass relative overflow-hidden border-0">
      <div className="h-0.5 bg-secondary">
        <div className="h-full bg-primary transition-[width] duration-200 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center gap-3 px-3 py-2">
        <button type="button" onClick={expand} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <img
            src={cover ?? ""}
            alt=""
            className="size-12 shrink-0 rounded-md object-cover outline outline-1 -outline-offset-1 outline-white/10"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{title}</span>
            <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
          </span>
        </button>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full bg-foreground text-background"
          onClick={toggle}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-5 fill-current" />
          ) : (
            <Play className="size-5 translate-x-px fill-current" />
          )}
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
      className="relative aspect-square w-full overflow-hidden rounded-xl bg-black shadow-lg outline outline-1 -outline-offset-1 outline-white/10"
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
  const audioShuffle = usePlayer((s) => s.shuffle);
  const audioToggle = usePlayer((s) => s.toggle);
  const audioNext = usePlayer((s) => s.next);
  const audioPrev = usePlayer((s) => s.prev);
  const audioSeek = usePlayer((s) => s.seek);
  const audioSetVolume = usePlayer((s) => s.setVolume);
  const audioToggleMute = usePlayer((s) => s.toggleMute);
  const audioCycleRepeat = usePlayer((s) => s.cycleRepeat);
  const audioToggleShuffle = usePlayer((s) => s.toggleShuffle);
  const patch = usePlayer((s) => s.patchTrack);
  const audioQueue = usePlayer((s) => s.queue);

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
  const ytShuffle = useYtPlayer((s) => s.shuffle);
  const ytQueue = useYtPlayer((s) => s.queue);
  const ytIndex = useYtPlayer((s) => s.index);
  const ytToggle = useYtPlayer((s) => s.toggle);
  const ytNext = useYtPlayer((s) => s.next);
  const ytPrev = useYtPlayer((s) => s.prev);
  const ytSeek = useYtPlayer((s) => s.seek);
  const ytSetVolume = useYtPlayer((s) => s.setVolume);
  const ytToggleMute = useYtPlayer((s) => s.toggleMute);
  const ytCycleRepeat = useYtPlayer((s) => s.cycleRepeat);
  const ytToggleShuffle = useYtPlayer((s) => s.toggleShuffle);
  const setYtExpanded = useYtPlayer((s) => s.setExpanded);
  const playYtAt = useYtPlayer((s) => s.playAt);
  const radioLoading = useYtPlayer((s) => s.radioLoading);

  const showShare = useShareSheet((s) => s.show);

  const isYt = Boolean(videoId) && ytExpanded;
  const expanded = isYt || (audioExpanded && Boolean(track));
  const isPlaying = isYt ? ytPlaying : audioPlaying;
  const position = isYt ? ytPos : audioPos;
  const duration = isYt ? ytDur : audioDur;
  const volume = isYt ? ytVol : audioVol;
  const muted = isYt ? ytMuted : audioMuted;
  const repeat = isYt ? ytRepeat : audioRepeat;
  const shuffle = isYt ? ytShuffle : audioShuffle;
  const title = isYt ? ytTitle : track?.title;
  const subtitle = isYt ? prettyArtistName(ytChannel ?? "") : track?.artistName;
  const cover = isYt ? ytThumb : track?.coverUrl;
  const toggle = isYt ? ytToggle : audioToggle;
  const next = isYt ? ytNext : audioNext;
  const prev = isYt ? ytPrev : audioPrev;
  const seek = isYt ? ytSeek : audioSeek;
  const setVolume = isYt ? ytSetVolume : audioSetVolume;
  const toggleMute = isYt ? ytToggleMute : audioToggleMute;
  const cycleRepeat = isYt ? ytCycleRepeat : audioCycleRepeat;
  const toggleShuffle = isYt ? ytToggleShuffle : audioToggleShuffle;
  const collapse = () => (isYt ? setYtExpanded(false) : setAudioExpanded(false));

  if (!expanded) return null;

  const related = isYt
    ? ytQueue
    : audioQueue.filter((q) => q.id !== track?.id).slice(0, 8);
  const canDownload =
    !isYt &&
    track &&
    (track.distribution === "free_download" || track.purchased || track.distribution === "free_stream");
  const pct = duration ? Math.min(100, (position / duration) * 100) : 0;

  const share = () =>
    showShare({
      kind: "Song",
      title: title ?? "VerzZify",
      subtitle: subtitle ?? "",
      coverUrl: cover ?? "",
      url:
        isYt && videoId
          ? shareWatchUrl(videoId)
          : track?.id
            ? shareTrackUrl(track.id)
            : window.location.origin,
    });

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background">
      {cover ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img src={cover} alt="" className="size-full scale-125 object-cover opacity-30 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>
      ) : null}

      <header className="relative z-10 flex items-center justify-between px-2 pt-3 pb-1">
        <button
          type="button"
          className="grid size-11 place-items-center"
          onClick={collapse}
          aria-label="Minimize player"
        >
          <ChevronDown className="size-7" />
        </button>
        <div className="min-w-0 text-center">
          <p className="text-[10px] font-bold tracking-[0.22em] text-muted-foreground uppercase">Playing from</p>
          <p className="truncate text-xs font-semibold">VerzZify</p>
        </div>
        <button type="button" className="grid size-11 place-items-center" aria-label="Share" onClick={share}>
          <Share2 className="size-5" />
        </button>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8">
        <div className="mx-auto mt-4 w-full max-w-sm">
          {isYt && videoId ? (
            <CoverEmbed videoId={videoId} />
          ) : (
            <img
              src={cover ?? ""}
              alt=""
              className="aspect-square w-full rounded-xl object-cover shadow-lg outline outline-1 -outline-offset-1 outline-white/10"
            />
          )}
        </div>

        <div className="mt-7 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-2xl font-bold tracking-tight">{title}</h2>
            {isYt ? (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
            ) : track ? (
              <Link
                to="/artist/$slug"
                params={{ slug: track.artistSlug }}
                className="mt-0.5 block truncate text-sm text-muted-foreground"
                onClick={() => setAudioExpanded(false)}
              >
                {track.artistName}
              </Link>
            ) : null}
          </div>
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center"
            aria-label="Like"
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
          >
            <Heart className={cn("size-6", !isYt && track?.liked && "fill-primary text-primary")} />
          </button>
        </div>

        <div className="mt-5">
          <label className="block">
            <span className="sr-only">Seek</span>
            <div className="relative h-1 w-full rounded-full bg-secondary">
              <div className="absolute inset-y-0 left-0 rounded-full bg-foreground" style={{ width: `${pct}%` }} />
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={position}
                onChange={(e) => seek(Number(e.target.value))}
                className="absolute inset-0 w-full cursor-pointer opacity-0"
              />
            </div>
          </label>
          <div className="mt-2 flex justify-between text-xs tabular text-muted-foreground">
            <span>{formatTime(position)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            className={cn("grid size-11 place-items-center", shuffle && "text-primary")}
            onClick={toggleShuffle}
            aria-label="Shuffle"
          >
            <Shuffle className="size-5" />
          </button>
          <button type="button" className="grid size-12 place-items-center" onClick={prev} aria-label="Previous">
            <SkipBack className="size-8 fill-current" />
          </button>
          <button
            type="button"
            className="grid size-16 place-items-center rounded-full bg-foreground text-background"
            onClick={toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="size-7 fill-current" />
            ) : (
              <Play className="size-7 translate-x-0.5 fill-current" />
            )}
          </button>
          <button type="button" className="grid size-12 place-items-center" onClick={next} aria-label="Next">
            <SkipForward className="size-8 fill-current" />
          </button>
          <button
            type="button"
            className={cn("grid size-11 place-items-center", repeat !== "off" && "text-primary")}
            onClick={cycleRepeat}
            aria-label="Repeat"
          >
            <Repeat className="size-5" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={toggleMute} aria-label="Mute" className="grid size-9 place-items-center">
            {muted ? <VolumeX className="size-4 text-muted-foreground" /> : <Volume2 className="size-4 text-muted-foreground" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1 flex-1 accent-foreground"
          />
          <Action
            icon={<ListMusic className="size-4" />}
            label=""
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
            icon={<Download className="size-4" />}
            label=""
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
          {!isYt && (
            <Action
              icon={<Video className="size-4" />}
              label=""
              onClick={() => {
                setAudioExpanded(false);
                if (track) window.location.href = `/artist/${track.artistSlug}`;
              }}
            />
          )}
        </div>

        {!isYt &&
          track &&
          (track.distribution === "paid_download" || track.distribution === "premium") &&
          !track.purchased && (
            <Button
              className="mt-4 w-full"
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
          <div className="mt-8 w-full">
            <p className="mb-3 text-sm font-bold">Next up</p>
            {isYt && radioLoading && <p className="mb-3 text-xs text-muted-foreground">Loading the rest of the set…</p>}
            <ul className="space-y-1">
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
                          onPlay={() =>
                            usePlayer.getState().play(audioQueue, audioQueue.findIndex((x) => x.id === q.id))
                          }
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
    <div className={cn("flex items-center gap-3 rounded-lg px-1 py-1.5", active && "bg-secondary")}>
      <button type="button" onClick={onPlay} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="w-5 text-center text-xs tabular text-muted-foreground">{n}</span>
        <img src={cover} alt="" className="size-12 shrink-0 rounded-md object-cover" />
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-sm font-semibold", active && "text-primary")}>{title}</span>
          <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
        </span>
        {playing ? <span className="text-primary" aria-hidden>●</span> : null}
      </button>
      <button
        type="button"
        className="grid size-10 shrink-0 place-items-center text-muted-foreground"
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
    <button type="button" onClick={onClick} className="grid size-9 place-items-center text-muted-foreground" aria-label={label || undefined}>
      {icon}
    </button>
  );
}
