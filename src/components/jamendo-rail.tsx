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

  const regionName = q.data?.regionName ?? "";
  const popular = q.data?.popular ?? [];
  const nearby = q.data?.nearby ?? [];
  const fresh = q.data?.fresh ?? [];
  const freeKeep = q.data?.freeKeep ?? [];
  const moodTracks = useMemo(() => q.data?.moods?.[mood] ?? [], [q.data, mood]);

  const empty = !q.isFetching && !popular.length && !fresh.length && !freeKeep.length;
  if (empty) return null;

  return (
    <div className="mt-10 space-y-10">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#2a1040] via-[#1a0b2e] to-[#0d1f2d] p-5 md:p-7">
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] text-emerald-300/90 uppercase">
            {regionName ? `Around ${regionName}` : "Around you"}
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            Independent artists
          </h2>
        </div>

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
            onClick={() => play(moodTracks, 0)}
          >
            Play {JAMENDO_MOODS.find((m) => m.id === mood)?.label} mix
          </button>
        )}
      </section>

      {(popular.length > 0 || q.isFetching) && (
        <section>
          <p className="text-xs tracking-[0.2em] text-sand uppercase">From your area</p>
          <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            {regionName ? `Popular in ${regionName}` : "Popular independents"}
          </h2>
          {q.isFetching && !popular.length ? (
            <div className="media-rail mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : (
            <div className="media-rail mt-4">
              {popular.map((t) => (
                <CoverCard
                  key={t.id}
                  track={t}
                  queue={popular}
                  subtitle={t.country ? `${t.artistName} · ${t.country}` : t.artistName}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {nearby.length > 0 && (
        <section>
          <p className="text-xs tracking-[0.2em] text-sand uppercase">Nearby scenes</p>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">From around the region</h2>
          <div className="media-rail mt-4">
            {nearby.map((t) => (
              <CoverCard
                key={t.id}
                track={t}
                queue={nearby}
                subtitle={t.country ? `${t.artistName} · ${t.country}` : t.artistName}
              />
            ))}
          </div>
        </section>
      )}

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

      {freeKeep.length > 0 && (
        <section>
          <p className="text-xs tracking-[0.2em] text-sand uppercase">Offline</p>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Free to keep</h2>
          <div className="mt-3 rounded-3xl bg-card p-2 md:p-3">
            {freeKeep.slice(0, 8).map((t, i) => (
              <TrackRow key={t.id} track={t} queue={freeKeep} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
