import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, Flag, Play, Share2, UserRound } from "lucide-react";
import type { YouTubePromotion } from "@/lib/zelyro/types";
import { useYtPlayer } from "@/lib/zelyro/yt-player";
import { recordClick, recordImpression, reportPromotion, toggleSavePromotion } from "@/lib/zelyro/promotions";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function YouTubePromotionCard({
  promo,
  compact = false,
}: {
  promo: YouTubePromotion;
  compact?: boolean;
}) {
  const open = useYtPlayer((s) => s.open);
  const seen = useRef(false);
  const [saved, setSaved] = useState(Boolean(promo.saved));

  useEffect(() => {
    if (seen.current) return;
    if (promo.campaignId === "preview") return;
    seen.current = true;
    void recordImpression({ data: promo.campaignId }).catch(() => undefined);
  }, [promo.campaignId]);

  async function track(kind: string) {
    if (promo.campaignId === "preview") return;
    await recordClick({ data: { campaignId: promo.campaignId, kind } }).catch(() => undefined);
  }

  function play() {
    void track("play");
    if (promo.video.embeddable) {
      open({
        videoId: promo.video.videoId,
        title: promo.video.title,
        channel: promo.video.channelName,
        watchUrl: promo.video.url,
      });
    } else {
      window.open(promo.video.url, "_blank", "noopener,noreferrer");
    }
  }

  async function share() {
    void track("share");
    const url = promo.video.url;
    try {
      if (navigator.share) await navigator.share({ title: promo.video.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("YouTube link copied");
      }
    } catch {
      toast("Could not share");
    }
  }

  return (
    <article className={cn("group min-w-0", compact && "flex gap-3")}>
      <button
        type="button"
        onClick={play}
        className={cn(
          "relative block overflow-hidden rounded-2xl bg-secondary",
          compact ? "size-24 shrink-0" : "w-full",
        )}
        aria-label={`Play ${promo.video.title} on YouTube`}
      >
        <img
          src={promo.video.thumbnailUrl}
          alt=""
          className={cn("object-cover", compact ? "size-full" : "aspect-video w-full")}
        />
        <span className="absolute inset-0 grid place-items-center bg-background/20 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
            <Play className="size-4 translate-x-px fill-current" />
          </span>
        </span>
        <span className="absolute top-2 left-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
          Promoted
        </span>
      </button>
      <div className={cn(compact ? "min-w-0 flex-1" : "mt-2.5")}>
        <p className="truncate text-sm font-medium">{promo.video.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {promo.video.channelName}
          {promo.genre ? ` · ${promo.genre}` : ""}
          {promo.country ? ` · ${promo.country}` : ""}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          YouTube · promoted by{" "}
          <Link to="/artist/$slug" params={{ slug: promo.zelyroArtistSlug }} className="underline">
            {promo.zelyroArtistName}
          </Link>
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <IconBtn label="Play" onClick={play}>
            <Play className="size-3.5 fill-current" />
          </IconBtn>
          <IconBtn label="Share" onClick={() => void share()}>
            <Share2 className="size-3.5" />
          </IconBtn>
          <IconBtn
            label="Save"
            onClick={async () => {
              try {
                const r = await toggleSavePromotion({ data: promo.linkId });
                setSaved(r.saved);
                void track("save");
              } catch {
                toast("Sign in to save");
              }
            }}
          >
            <Bookmark className={cn("size-3.5", saved && "fill-current")} />
          </IconBtn>
          <Link
            to="/artist/$slug"
            params={{ slug: promo.zelyroArtistSlug }}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-secondary px-2.5 text-[11px] text-muted-foreground"
            onClick={() => void track("profile")}
          >
            <UserRound className="size-3.5" />
            Artist
          </Link>
          <IconBtn
            label="Report"
            onClick={async () => {
              try {
                await reportPromotion({ data: { campaignId: promo.campaignId, reason: "inappropriate" } });
                toast("Report in. An admin will review it.");
              } catch {
                toast("Sign in to report");
              }
            }}
          >
            <Flag className="size-3.5" />
          </IconBtn>
        </div>
      </div>
    </article>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1 rounded-full bg-secondary px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
    >
      {children}
    </button>
  );
}

export function PromotedBadge({ children = "Promoted" }: { children?: string }) {
  return (
    <Badge className="bg-sand/15 text-sand">
      {children}
    </Badge>
  );
}
