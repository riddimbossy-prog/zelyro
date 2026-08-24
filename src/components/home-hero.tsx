import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "@/components/icons";
import type { YouTubeVideo } from "@/lib/verzzify/types";
import { useYtPlayer } from "@/lib/verzzify/yt-player";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeHero({
  videos,
  regionName,
}: {
  videos: YouTubeVideo[];
  regionName: string;
}) {
  const slides = videos.slice(0, 12);
  const [i, setI] = useState(0);
  const openQueue = useYtPlayer((s) => s.openQueue);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % slides.length), 6500);
    return () => window.clearInterval(t);
  }, [slides.length]);

  if (!slides.length) return null;
  const v = slides[i] ?? slides[0];

  return (
    <section className="relative overflow-hidden rounded-2xl md:rounded-3xl">
      <img src={v.thumbnailUrl} alt="" className="absolute inset-0 size-full object-cover transition-opacity duration-500" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20" />
      <div className="relative flex min-h-[240px] flex-col justify-end gap-4 p-5 md:min-h-[320px] md:flex-row md:items-end md:justify-between md:p-8">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
            Popular · {regionName}
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight md:text-6xl">{v.title}</h1>
          <p className="mt-2 text-[15px] font-semibold text-white/80">{v.channelName}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => {
                const idx = slides.findIndex((s) => s.videoId === v.videoId);
                openQueue(slides, idx >= 0 ? idx : 0);
              }}
            >
              <Play className="size-4 translate-x-px fill-current" />
              Play
            </Button>
            <Button variant="outline" size="lg" onClick={() => openQueue(slides, 0)}>
              Play mix
            </Button>
          </div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            aria-label="Previous"
            className="grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur"
            onClick={() => setI((n) => (n - 1 + slides.length) % slides.length)}
          >
            <ChevronLeft className="size-5" />
          </button>
          <img
            src={v.thumbnailUrl}
            alt=""
            className="size-36 rounded-xl object-cover shadow-lg ring-1 ring-white/15 md:size-44"
          />
          <button
            type="button"
            aria-label="Next"
            className="grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur"
            onClick={() => setI((n) => (n + 1) % slides.length)}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 md:bottom-4">
          {slides.map((s, n) => (
            <button
              key={s.videoId}
              type="button"
              aria-label={`Go to ${s.title}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                n === i ? "w-6 bg-primary" : "w-1.5 bg-white/40",
              )}
              onClick={() => setI(n)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
