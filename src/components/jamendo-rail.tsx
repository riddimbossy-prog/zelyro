import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CoverCard } from "@/components/cover-card";
import { TrackRow } from "@/components/track-row";
import { getJamendoHome, JAMENDO_MOODS, type JamendoMoodId } from "@/lib/verzzify/jamendo";
import { usePlayer } from "@/lib/verzzify/player";
import { cn } from "@/lib/utils";

export function JamendoRail() {
  const [mood, setMood] = useState<JamendoMoodId>("focus");
  const play = usePlayer((s) => s.play);

  const q = useQuery({
    queryKey: ["jamendo-home"],
    queryFn: () => getJamendoHome(),
    staleTime: 15 * 60_000,
  });

  const popular = q.data?.popular ?? [];
  const fresh = q.data?.fresh ?? [];
  const freeKeep = q.data?.freeKeep ?? [];
  const moodTracks = useMemo(() => q.data?.moods?.[mood] ?? [], [q.data, mood]);

  const empty = !q.isFetching && !popular.length && !fresh.length && !freeKeep.length;
  if (empty) return null;

  return (
    <div className="mt-10 space-y-10">
      {/* Hero strip — licensed independents */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#2a1040] via-[#1a0b2e] to-[#0d1f2d] p-5 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.22em] text-emerald-300/90 uppercase">
              On VerzZify · Licensed
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
              Independent artists
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Stream full tracks from creators on Jamendo — clear licences, no YouTube quota. Plays in
              your VerzZify player.
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-emerald-300 uppercase">
            Legal catalog
          </span>
        </div>

        {/* Mood chips */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {JAMENDO_MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMood(m.id)}
              className={cn(
                "shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition",
                `bg-gradient-to-br ${m.color}`,
                mood === m.id ? "ring-2 ring-white/80 scale-[1.02]" : "opacity-80 hover:opacity-100",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="media-rail mt-5">
          {q.isFetching && !moodTracks.length
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square min-w-[8.5rem] animate-pulse rounded-2xl bg-white/10" />
              ))
            : moodTracks.map((t) => (
                <CoverCard key={t.id} track={t} queue={moodTracks} subtitle={t.artistName} />
              ))}
        </div>

        {moodTracks[0] && (
          <button
            type="button"
            className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#1a0b2e] hover:bg-white/90"
            onClick={() => play(moodTracks[0], moodTracks)}
          >
            Play {JAMENDO_MOODS.find((m) => m.id === mood)?.label} mix
          </button>
        )}
      </section>

      {/* Popular */}
      {(popular.length > 0 || q.isFetching) && (
        <section>
          <p className="text-xs tracking-[0.2em] text-sand uppercase">Independent</p>
          <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            Popular on VerzZify
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Most loved licensed tracks right now</p>
          {q.isFetching && !popular.length ? (
            <div className="media-rail mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : (
            <div className="media-rail mt-4">
              {popular.map((t) => (
                <CoverCard key={t.id} track={t} queue={popular} subtitle={t.artistName} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Fresh releases */}
      {fresh.length > 0 && (
        <section>
          <p className="text-xs tracking-[0.2em] text-sand uppercase">Just dropped</p>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">New independents</h2>
          <div className="media-rail mt-4">
            {fresh.map((t) => (
              <CoverCard key={t.id} track={t} queue={fresh} subtitle={t.artistName} />
            ))}
          </div>
        </section>
      )}

      {/* Free to keep — only when download allowed by licence */}
      {freeKeep.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.2em] text-sand uppercase">Download allowed</p>
              <h2 className="font-display text-2xl font-extrabold tracking-tight">Free to keep</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tracks where the licence allows offline save in VerzZify
              </p>
            </div>
          </div>
          <div className="rounded-3xl bg-card p-2 md:p-3">
            {freeKeep.slice(0, 8).map((t, i) => (
              <TrackRow key={t.id} track={t} queue={freeKeep} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
