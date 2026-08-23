import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Heart,
  MapPin,
  Pause,
  Play,
  Radio,
  Share2,
  ShoppingBag,
  Ticket,
  Video,
} from "lucide-react";
import type { AlbumCard, ArtistCard, LiveCard, PlaylistCard, PostCard, TrackCard } from "@/lib/verzzify/types";
import { getSpectrum, usePlayer } from "@/lib/verzzify/player";
import { useShareSheet } from "@/lib/verzzify/share";
import { toggleLike, purchaseTrack } from "@/lib/verzzify/queries";
import { Button } from "@/components/ui/button";
import { ArtistTile } from "@/components/cover-card";
import { FollowButton } from "@/components/follow-button";
import { cn, formatCount, formatMoney, formatTime } from "@/lib/utils";
import { toast } from "sonner";

type TabId = "music" | "shop" | "live" | "following" | "community" | "about";

function barsFor(seed: string, count = 80) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const n = ((h >>> 0) % 1000) / 1000;
    const envelope = 0.32 + 0.68 * Math.sin((i / count) * Math.PI);
    out.push(0.14 + Math.pow(n, 0.55) * 0.86 * envelope);
  }
  return out;
}

function sparkPoints(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const pts: string[] = [];
  for (let i = 0; i < 14; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const y = 4 + (((h >>> 0) % 160) / 160) * 16;
    pts.push(`${(i / 13) * 64},${(20 - y).toFixed(1)}`);
  }
  return pts.join(" ");
}

function licenseOf(track: TrackCard) {
  if (track.purchased) return { label: "You own this file", kind: "owned" as const };
  if (track.distribution === "free_download") return { label: "Free file", kind: "free" as const };
  if (track.distribution === "paid_download") return { label: "Keep the file", kind: "buy" as const };
  if (track.distribution === "premium") return { label: "Premium file", kind: "buy" as const };
  return { label: "Stream", kind: "stream" as const };
}

export function MackWaveform({
  seed,
  progress,
  live = false,
  tall = false,
  onSeek,
}: {
  seed: string;
  progress: number;
  live?: boolean;
  tall?: boolean;
  onSeek?: (pct: number) => void;
}) {
  const bars = useMemo(() => barsFor(seed, tall ? 96 : 72), [seed, tall]);
  const wrapRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!live) return;
    let raf = 0;
    const tick = () => {
      const spec = getSpectrum();
      const nodes = wrapRef.current?.children;
      if (nodes && spec.length) {
        for (let i = 0; i < nodes.length; i++) {
          const s = spec[Math.floor((i / nodes.length) * spec.length)] ?? 0;
          const h = 0.16 + (s / 255) * 0.84;
          (nodes[i] as HTMLElement).style.height = `${Math.round(h * 100)}%`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live]);

  return (
    <button
      ref={wrapRef}
      type="button"
      className={cn("mack-wave text-muted-foreground", tall && "mack-wave-lg")}
      aria-label="Seek"
      onClick={(e) => {
        if (!onSeek) return;
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
      }}
    >
      {bars.map((h, i) => {
        const filled = i / bars.length <= progress;
        return (
          <i
            key={i}
            className={cn(filled ? "bg-primary" : "bg-current opacity-40")}
            style={{ height: `${Math.round(h * 100)}%` }}
          />
        );
      })}
    </button>
  );
}

export function MackTrackCard({
  track,
  queue,
  index,
  featured = false,
  chartRank,
}: {
  track: TrackCard;
  queue: TrackCard[];
  index: number;
  featured?: boolean;
  chartRank?: number;
}) {
  const play = usePlayer((s) => s.play);
  const toggle = usePlayer((s) => s.toggle);
  const seek = usePlayer((s) => s.seek);
  const currentId = usePlayer((s) => s.queue[s.index]?.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const patch = usePlayer((s) => s.patchTrack);
  const showShare = useShareSheet((s) => s.show);
  const active = currentId === track.id;
  const progress = active && duration ? position / duration : 0;
  const len = formatTime((track.durationMs || 0) / 1000);
  const license = licenseOf(track);

  return (
    <article
      className={cn(
        "glass overflow-hidden rounded-[24px] p-4 transition-[box-shadow] duration-200",
        featured && "p-5",
        active && "shadow-[var(--shadow-border-hover)]",
      )}
    >
      <div className="flex gap-4">
        <button
          type="button"
          className={cn(
            "cover-shine relative shrink-0 overflow-hidden",
            active && isPlaying ? "rounded-full" : "rounded-xl",
          )}
          onClick={() => (active ? toggle() : play(queue, index))}
          aria-label={`Play ${track.title}`}
        >
          <img
            src={track.coverUrl}
            alt=""
            className={cn(
              "object-cover",
              featured ? "size-28 md:size-32" : "size-20 md:size-24",
              active && isPlaying && "cover-spin",
            )}
          />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/track/$id"
                  params={{ id: track.id }}
                  className={cn(
                    "truncate font-medium",
                    featured ? "text-lg" : "text-sm",
                    active && "text-primary",
                  )}
                >
                  {track.title}
                </Link>
                {chartRank ? (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-sand">
                    Global #{chartRank}
                  </span>
                ) : null}
                {track.explicit ? (
                  <span className="rounded-sm bg-secondary px-1 text-xs text-muted-foreground">E</span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {track.featuredArtists ? `Feat. ${track.featuredArtists}` : track.artistName}
                {track.albumTitle ? ` · ${track.albumTitle}` : ""}
              </p>
            </div>
            <button
              type="button"
              className="hidden text-muted-foreground sm:grid size-9 place-items-center"
              aria-label="Share"
              onClick={() =>
                showShare({
                  kind: "Song",
                  title: track.title,
                  subtitle: track.artistName,
                  coverUrl: track.coverUrl,
                  url: `${typeof window !== "undefined" ? window.location.origin : ""}/track/${track.id}`,
                })
              }
            >
              <Share2 className="size-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
              onClick={() => (active ? toggle() : play(queue, index))}
              aria-label={active && isPlaying ? "Pause" : "Play"}
            >
              {active && isPlaying ? (
                <Pause className="size-4 fill-current" />
              ) : (
                <Play className="size-4 translate-x-px fill-current" />
              )}
            </button>
            <MackWaveform
              seed={track.id}
              progress={progress}
              live={active && isPlaying}
              onSeek={(pct) => {
                if (!active) play(queue, index);
                seek(pct * ((duration || track.durationMs / 1000) || 0));
              }}
            />
            <span className="w-10 shrink-0 text-right text-xs tabular text-muted-foreground">{len}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              {active && isPlaying ? (
                <span className="flex h-3 items-end gap-px">
                  <i className="eq-dot inline-block h-3 w-0.5 bg-primary" />
                  <i className="eq-dot inline-block h-3 w-0.5 bg-primary" />
                  <i className="eq-dot inline-block h-3 w-0.5 bg-primary" />
                </span>
              ) : (
                <Play className="size-3 fill-current" />
              )}
              {formatCount(track.playCount)}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-foreground"
              onClick={async () => {
                try {
                  const r = await toggleLike({ data: track.id });
                  patch(track.id, { liked: r.liked });
                } catch {
                  toast("Could not save this song");
                }
              }}
            >
              <Heart className={cn("size-3", track.liked && "fill-primary text-primary")} />
              {formatCount(track.likeCount)}
            </button>
            <span className={cn(license.kind === "owned" ? "text-sand" : "")}>{license.label}</span>
            {license.kind === "buy" && (
              <button
                type="button"
                className="ml-auto inline-flex h-9 items-center gap-1 rounded-full bg-secondary px-3 text-xs font-medium text-foreground"
                onClick={async () => {
                  try {
                    await purchaseTrack({
                      data: {
                        trackId: track.id,
                        license: track.distribution === "premium" ? "premium" : "basic",
                      },
                    });
                    patch(track.id, { purchased: true });
                    toast("Receipt in Library — the file is yours");
                  } catch {
                    toast("Could not buy this track");
                  }
                }}
              >
                <ShoppingBag className="size-3" />
                {formatMoney(track.priceCents, track.currency)}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function Stage({
  track,
  queue,
  chartRank,
}: {
  track: TrackCard;
  queue: TrackCard[];
  chartRank?: number;
}) {
  const play = usePlayer((s) => s.play);
  const toggle = usePlayer((s) => s.toggle);
  const seek = usePlayer((s) => s.seek);
  const currentId = usePlayer((s) => s.queue[s.index]?.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const active = currentId === track.id;
  const progress = active && duration ? position / duration : 0;
  const license = licenseOf(track);

  return (
    <article className="relative overflow-hidden rounded-[28px]">
      <img src={track.coverUrl} alt="" className="absolute inset-0 size-full scale-110 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
      <div className="relative flex flex-col gap-5 p-5 md:flex-row md:items-end md:p-8">
        <img
          src={track.coverUrl}
          alt=""
          className="size-36 rounded-2xl object-cover shadow-[var(--glass-shadow)] md:size-44"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs tracking-[0.22em] text-sand uppercase">On stage</p>
          <h2 className="mt-1 font-display text-3xl md:text-4xl">{track.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {track.artistName}
            {chartRank ? ` · Global #${chartRank}` : ""}
            {` · ${license.label}`}
          </p>
          <div className="mt-4">
            <MackWaveform
              seed={track.id}
              progress={progress}
              live={active && isPlaying}
              tall
              onSeek={(pct) => {
                if (!active) play(queue, 0);
                seek(pct * ((duration || track.durationMs / 1000) || 0));
              }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() => (active ? toggle() : play(queue, 0))}
            >
              {active && isPlaying ? (
                <Pause className="size-4 fill-current" />
              ) : (
                <Play className="size-4 fill-current" />
              )}
              {active && isPlaying ? "Pause" : "Play"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/track/$id" params={{ id: track.id }}>
                Open song
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  seed,
  onClick,
}: {
  label: string;
  value: string;
  seed: string;
  onClick?: () => void;
}) {
  const pts = useMemo(() => sparkPoints(seed), [seed]);
  const inner = (
    <>
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl tabular">{value}</p>
      <svg viewBox="0 0 64 24" className="mt-2 h-6 w-full text-primary" aria-hidden>
        <polyline fill="none" stroke="currentColor" strokeWidth="1.6" points={pts} />
      </svg>
    </>
  );
  const cls = "glass min-w-0 rounded-2xl px-4 py-3 text-left";
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}

export function MackProfileView({
  name,
  slug,
  avatarUrl,
  bannerUrl,
  bio,
  city,
  country,
  verified,
  totalPlays,
  followers,
  followingCount,
  genres,
  monthlyListeners,
  tracks,
  albums,
  liked = [],
  playlists = [],
  following = [],
  posts = [],
  live = [],
  chartRanks = {},
  isOwner = false,
  isFollowing = false,
  artistId,
  suggested = [],
  about,
  videoCall,
  onBookCall,
}: {
  name: string;
  slug: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  verified: boolean;
  totalPlays: number;
  followers: number;
  followingCount: number;
  genres: string | null;
  monthlyListeners: number;
  tracks: TrackCard[];
  albums: AlbumCard[];
  liked?: TrackCard[];
  playlists?: PlaylistCard[];
  following?: ArtistCard[];
  posts?: PostCard[];
  live?: LiveCard[];
  chartRanks?: Record<string, number>;
  isOwner?: boolean;
  isFollowing?: boolean;
  artistId?: string;
  suggested?: ArtistCard[];
  about?: ReactNode;
  videoCall?: { priceCents: number; durationMin: number; available: boolean } | null;
  onBookCall?: () => void;
}) {
  const play = usePlayer((s) => s.play);
  const showShare = useShareSheet((s) => s.show);
  const [tab, setTab] = useState<TabId>("music");
  const featured = tracks[0];
  const shop = tracks.filter((t) => t.distribution === "paid_download" || t.distribution === "premium");
  const owned = tracks.filter((t) => t.purchased).length;
  const location = [city, country].filter(Boolean).join(", ");
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/artist/${slug}`;

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "music", label: "Music", count: tracks.length },
    { id: "shop", label: "Shop", count: shop.length },
    { id: "live", label: "Live", count: live.length + (videoCall?.available ? 1 : 0) },
    ...(isOwner ? [{ id: "following" as const, label: "Following", count: following.length + suggested.length }] : []),
    { id: "community", label: "Community" },
    { id: "about", label: "About" },
  ];

  return (
    <div className="-mx-4 md:-mx-8">
      <div className="relative h-56 overflow-hidden md:h-80">
        <img src={bannerUrl ?? "/banners/hero.jpg"} alt="" className="size-full object-cover" />
        <div className="profile-hero-scrim absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-6 md:px-8 md:pb-8">
          <div className="flex items-end gap-4">
            <img
              src={avatarUrl ?? "/favicon.svg"}
              alt=""
              className="avatar-ring size-24 rounded-full object-cover md:size-32"
            />
            <div className="min-w-0 pb-1">
              <h1 className="flex items-center gap-2 font-display text-3xl md:text-5xl">
                <span className="truncate">{name}</span>
                {verified && <BadgeCheck className="size-7 shrink-0 text-primary" />}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>@{slug}</span>
                {location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {location}
                  </span>
                )}
                {genres && <span className="text-sand">{genres}</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8">
        {bio && <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{bio}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {!isOwner && artistId && (
            <FollowButton artistId={artistId} artistName={name} initial={isFollowing} size="lg" />
          )}
          {tracks.length > 0 && (
            <Button variant={!isOwner && artistId ? "outline" : "default"} onClick={() => play(tracks, 0)}>
              <Play className="size-4 fill-current" /> Play all
            </Button>
          )}
          {isOwner ? (
            <>
              <Button variant="outline" asChild>
                <Link to="/studio">Upload</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setTab("about")}>
                Edit
              </Button>
            </>
          ) : null}
          {videoCall?.available && (
            <Button variant="outline" onClick={onBookCall}>
              <Video className="size-4" /> 1-1
            </Button>
          )}
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-secondary text-muted-foreground"
            aria-label="Share profile"
            onClick={() =>
              showShare({
                kind: "Song",
                title: name,
                subtitle: `@${slug}`,
                coverUrl: avatarUrl ?? "/favicon.svg",
                url: shareUrl,
              })
            }
          >
            <Share2 className="size-4" />
          </button>
        </div>
        {!isOwner && artistId && (
          <p className="mt-2 text-xs text-muted-foreground">
            {isFollowing
              ? "You’ll get new songs from this artist on Home and in Library."
              : "Follow to get new drops on Home and in Library."}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Plays" value={formatCount(totalPlays)} seed={`${slug}-plays`} />
          <Stat label="Monthly" value={formatCount(monthlyListeners)} seed={`${slug}-mo`} />
          <Stat
            label="Followers"
            value={formatCount(followers)}
            seed={`${slug}-fol`}
            onClick={isOwner ? () => setTab("following") : undefined}
          />
          <Stat
            label="Keep the file"
            value={String(shop.length || owned)}
            seed={`${slug}-own`}
          />
        </div>

        <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "h-12 shrink-0 px-4 text-sm transition-colors",
                tab === t.id
                  ? "border-b-2 border-primary font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {typeof t.count === "number" && t.count > 0 ? (
                <span className="ml-1.5 text-xs text-muted-foreground">{t.count}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="pt-6">
          {tab === "music" && (
            <div className="space-y-4">
              {featured && <Stage track={featured} queue={tracks} chartRank={chartRanks[featured.id]} />}
              {tracks.slice(1).map((t, i) => (
                <MackTrackCard
                  key={t.id}
                  track={t}
                  queue={tracks}
                  index={i + 1}
                  chartRank={chartRanks[t.id]}
                />
              ))}
              {(albums.length > 0 || (isOwner && playlists.length > 0)) && (
                <div className="pt-4">
                  <p className="mb-3 font-display text-xl">{isOwner ? "Lists" : "Albums"}</p>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {isOwner
                      ? playlists.map((p) => (
                          <Link key={p.id} to="/library" className="min-w-0">
                            <img
                              src={p.coverUrl ?? "/covers/glass-hour.jpg"}
                              alt=""
                              className="cover-shine aspect-square w-full rounded-2xl object-cover"
                            />
                            <p className="mt-2 truncate text-sm font-medium">{p.title}</p>
                            <p className="text-xs text-muted-foreground">{p.kind}</p>
                          </Link>
                        ))
                      : albums.map((a) => (
                          <Link key={a.id} to="/album/$id" params={{ id: a.id }} className="min-w-0">
                            <img
                              src={a.coverUrl}
                              alt=""
                              className="cover-shine aspect-square w-full rounded-2xl object-cover"
                            />
                            <p className="mt-2 truncate text-sm font-medium">{a.title}</p>
                            <p className="text-xs text-muted-foreground">{a.albumType}</p>
                          </Link>
                        ))}
                  </div>
                </div>
              )}
              {tracks.length === 0 && (
                <Empty
                  title="No music yet"
                  body={isOwner ? "Drop a master in Studio and it lands on this stage." : "This artist has not published on VerzZify yet."}
                  action={isOwner ? <Link to="/studio">Open Studio</Link> : null}
                />
              )}
            </div>
          )}

          {tab === "shop" && (
            <div className="space-y-4">
              <p className="max-w-xl text-sm text-muted-foreground">
                A purchase is a license. Copyright stays with {name}. The file lives in your Library.
              </p>
              {shop.map((t) => (
                <MackTrackCard
                  key={t.id}
                  track={t}
                  queue={shop}
                  index={shop.indexOf(t)}
                  chartRank={chartRanks[t.id]}
                />
              ))}
              {shop.length === 0 && (
                <Empty title="Nothing for sale" body="Free streams live on Music. Paid files will show here." />
              )}
            </div>
          )}

          {tab === "live" && (
            <div className="space-y-4">
              {videoCall?.available && (
                <article className="glass flex flex-wrap items-center justify-between gap-4 rounded-[28px] p-5">
                  <div>
                    <p className="text-xs tracking-[0.2em] text-sand uppercase">Fan session</p>
                    <p className="mt-1 font-display text-2xl">1-1 video</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {videoCall.durationMin} minutes · {formatMoney(videoCall.priceCents)}
                    </p>
                  </div>
                  {isOwner ? (
                    <Button variant="outline" asChild>
                      <Link to="/studio">Manage</Link>
                    </Button>
                  ) : (
                    <Button onClick={onBookCall}>
                      <Video className="size-4" /> Join
                    </Button>
                  )}
                </article>
              )}
              {live.map((l) => (
                <Link
                  key={l.id}
                  to="/live/$id"
                  params={{ id: l.id }}
                  className="glass flex gap-4 overflow-hidden rounded-[24px] p-3"
                >
                  <img src={l.posterUrl} alt="" className="size-24 rounded-xl object-cover" />
                  <div className="min-w-0 py-1">
                    <p className="inline-flex items-center gap-1 text-xs text-sand">
                      <Radio className="size-3" /> {l.status === "live" ? "Live now" : "Scheduled"}
                    </p>
                    <p className="mt-1 font-display text-xl">{l.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {l.startsAt ? new Date(l.startsAt).toUTCString().slice(0, 16) : ""}
                      {l.isFree ? " · Free" : ` · ${formatMoney(l.priceCents)}`}
                    </p>
                  </div>
                </Link>
              ))}
              {live.length === 0 && !videoCall?.available && (
                <Empty
                  title="No live on the books"
                  body={isOwner ? "Schedule a stream from Studio." : `${name} has no live set yet.`}
                  action={isOwner ? <Link to="/studio">Studio</Link> : null}
                />
              )}
            </div>
          )}

          {tab === "following" && (
            <div className="space-y-8">
              <div>
                <p className="font-display text-xl">Artists you follow</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Their new songs land on Home and in Library.
                </p>
                {following.length > 0 ? (
                  <div className="mt-4 grid grid-cols-3 gap-4 md:grid-cols-6">
                    {following.map((a) => (
                      <ArtistTile
                        key={a.id}
                        id={a.id}
                        slug={a.slug}
                        name={a.name}
                        avatarUrl={a.avatarUrl}
                        verified={a.verified}
                        followed
                      />
                    ))}
                  </div>
                ) : (
                  <Empty title="Not following anyone yet" body="Tap Follow on an artist to get their drops." />
                )}
              </div>
              {suggested.length > 0 && (
                <div>
                  <p className="mb-1 font-display text-xl">Artists to follow</p>
                  <p className="mb-3 text-sm text-muted-foreground">Follow to get their new songs on Home.</p>
                  <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
                    {suggested.map((a) => (
                      <ArtistTile
                        key={a.id}
                        id={a.id}
                        slug={a.slug}
                        name={a.name}
                        avatarUrl={a.avatarUrl}
                        verified={a.verified}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "community" && (
            <div className="space-y-8">
              {isOwner && liked.length > 0 && (
                <div>
                  <p className="mb-3 font-display text-xl">Favorites</p>
                  <div className="space-y-3">
                    {liked.slice(0, 6).map((t, i) => (
                      <MackTrackCard key={t.id} track={t} queue={liked} index={i} chartRank={chartRanks[t.id]} />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-3 font-display text-xl">Feed</p>
                <div className="space-y-3">
                  {posts.map((p) => (
                    <article key={p.id} className="glass flex gap-3 rounded-2xl p-4">
                      <img
                        src={p.authorAvatar ?? avatarUrl ?? "/favicon.svg"}
                        alt=""
                        className="size-10 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{p.authorName}</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                        {p.imageUrl && (
                          <img src={p.imageUrl} alt="" className="mt-3 max-h-56 rounded-xl object-cover" />
                        )}
                      </div>
                    </article>
                  ))}
                  {posts.length === 0 && <Empty title="Quiet feed" body="New posts from this profile land here." />}
                </div>
              </div>
            </div>
          )}

          {tab === "about" && (
            <div className="space-y-4">
              <div className="glass rounded-[28px] p-6">
                {about ?? (
                  <dl className="grid gap-4 text-sm md:grid-cols-2">
                    <Info label="Location" value={location || "—"} />
                    <Info label="Genres" value={genres || "—"} />
                    <Info label="Monthly listeners" value={formatCount(monthlyListeners)} />
                    <Info label="Following" value={formatCount(followingCount)} />
                    <Info label="Followers" value={formatCount(followers)} />
                    <Info label="Handle" value={`@${slug}`} />
                  </dl>
                )}
              </div>
              <aside className="glass rounded-[28px] p-6">
                <p className="text-xs tracking-[0.2em] text-sand uppercase">On VerzZify</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>Hosted files you can keep.</li>
                  <li>Direct-to-fan sales count on the Global 200. Copyright never moves.</li>
                  <li>No radio. No recurrent rule. A song can live on the board.</li>
                  <li className="inline-flex items-center gap-2">
                    <Ticket className="size-3.5" /> Live, tickets, and 1-1 in the same house.
                  </li>
                </ul>
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}

function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="glass rounded-[28px] px-6 py-12 text-center">
      <p className="font-display text-xl">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {action && <p className="mt-4 text-sm font-medium text-primary">{action}</p>}
    </div>
  );
}
