import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CoverCard } from "@/components/cover-card";
import { getJamendoGenrePack } from "@/lib/verzzify/jamendo";
import { GENRES } from "@/lib/verzzify/genres";

export function JamendoGenreBrowse() {
  const q = useQuery({
    queryKey: ["jamendo-genre-pack"],
    queryFn: () => getJamendoGenrePack(),
    staleTime: 15 * 60_000,
  });
  const packs = q.data ?? [];
  if (!q.isFetching && !packs.length) return null;

  return (
    <div className="mt-8 space-y-8">
      <div>
        <p className="text-xs tracking-[0.2em] text-sand uppercase">Independent catalog</p>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Playable by genre</h2>
      </div>
      {(packs.length ? packs : GENRES.slice(0, 4).map((g) => ({ slug: g.slug, name: g.name, tracks: [] }))).map(
        (pack) => (
          <section key={pack.slug}>
            <div className="mb-3 flex items-end justify-between gap-3">
              <h3 className="font-display text-xl font-extrabold tracking-tight">{pack.name}</h3>
              <Link to="/genre/$slug" params={{ slug: pack.slug }} className="text-sm font-medium text-primary">
                Open
              </Link>
            </div>
            <div className="media-rail">
              {pack.tracks.length
                ? pack.tracks.map((t) => (
                    <CoverCard key={t.id} track={t} queue={pack.tracks} subtitle={t.artistName} />
                  ))
                : Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="aspect-square min-w-[8.5rem] animate-pulse rounded-2xl bg-secondary" />
                  ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
}
