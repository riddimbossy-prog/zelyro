import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "@/components/icons";
import { z } from "zod";
import { getCharts } from "@/lib/verzzify/charts";
import { ChartArtistRow, ChartTrackRow } from "@/components/chart-row";
import { usePlayer } from "@/lib/verzzify/player";
import { Button } from "@/components/ui/button";
import { cn, formatCount } from "@/lib/utils";

const searchSchema = z.object({
  kind: z.enum(["tracks", "artists"]).optional(),
  scope: z.string().optional(),
  genre: z.string().optional(),
});

export const Route = createFileRoute("/_app/charts")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getCharts({ data: deps }),
  component: ChartsPage,
});

function ChartsPage() {
  const board = Route.useLoaderData();
  const search = Route.useSearch();
  const play = usePlayer((s) => s.play);
  const kind = search.kind === "artists" ? "artists" : "tracks";
  const scope = search.scope ?? "global";
  const genre = search.genre ?? "all";
  const top = board.tracks.slice(0, 3);
  const rest = board.tracks.slice(3);
  const companions = board.countries.filter((c) => c.id === "global" || c.id === "excl_us");
  const territories = board.countries.filter((c) => c.id !== "global" && c.id !== "excl_us");

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-sand uppercase">VerzZify Charts</p>
      <h1 className="glow-title mt-2 font-display text-4xl md:text-5xl">{board.title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{board.subtitle}</p>
      <p className="mt-1 text-xs text-muted-foreground">{board.updatedLabel}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["tracks", "Tracks"],
            ["artists", "Artists"],
          ] as const
        ).map(([id, label]) => (
          <Link
            key={id}
            to="/charts"
            search={{ kind: id, scope, genre: genre === "all" ? undefined : genre }}
            className={cn(
              "chip flex h-11 items-center rounded-full px-4 text-sm",
              kind === id ? "bg-primary text-primary-foreground" : "glass text-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        {companions.map((c) => (
          <Link
            key={c.id}
            to="/charts"
            search={{ kind, scope: c.id, genre: genre === "all" ? undefined : genre }}
            className={cn(
              "flex h-11 items-center rounded-full px-4 text-sm",
              scope === c.id ? "bg-foreground text-background" : "bg-secondary text-muted-foreground",
            )}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {territories.map((c) => (
          <Link
            key={c.id}
            to="/charts"
            search={{ kind, scope: c.id, genre: genre === "all" ? undefined : genre }}
            className={cn(
              "chip flex h-10 shrink-0 items-center rounded-full px-3 text-sm",
              scope === c.id ? "bg-foreground text-background" : "glass text-muted-foreground",
            )}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {kind === "tracks" && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {board.genres.map((g) => (
            <Link
              key={g.id}
              to="/charts"
              search={{ kind, scope, genre: g.id === "all" ? undefined : g.id }}
              className={cn(
                "chip flex h-10 shrink-0 items-center rounded-full px-3 text-sm",
                (genre || "all") === g.id ? "glass text-foreground" : "text-muted-foreground",
              )}
            >
              {g.label}
            </Link>
          ))}
        </div>
      )}

      {kind === "tracks" && top[0] && (
        <section className="mt-8 grid gap-3 md:grid-cols-[minmax(0,1.4fr)_1fr_1fr]">
          {top.map((entry, i) => (
            <article
              key={entry.track.id}
              className={cn("cover-shine overflow-hidden rounded-[28px] bg-card", i === 0 && "md:row-span-1")}
            >
              <button
                type="button"
                className="relative block w-full"
                onClick={() => play(board.tracks.map((e) => e.track), i)}
                aria-label={`Play ${entry.track.title}`}
              >
                <img
                  src={entry.track.coverUrl}
                  alt=""
                  className={cn("w-full object-cover", i === 0 ? "aspect-[4/3] md:aspect-[16/10]" : "aspect-square")}
                />
                <span className="absolute top-3 left-3 font-display text-4xl tabular">{entry.rank}</span>
                <span className="absolute right-3 bottom-3 grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Play className="size-4 translate-x-px fill-current" />
                </span>
              </button>
              <div className="p-4">
                <Link to="/track/$id" params={{ id: entry.track.id }} className="font-display text-xl">
                  {entry.track.title}
                </Link>
                <Link
                  to="/artist/$slug"
                  params={{ slug: entry.track.artistSlug }}
                  className="mt-1 block text-sm text-muted-foreground"
                >
                  {entry.track.artistName}
                </Link>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatCount(entry.points)} SEU · {formatCount(entry.sales)} sales · {formatCount(entry.track.playCount)}{" "}
                  streams
                  {entry.gainer ? " · Greatest gainer" : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Last week {entry.previousRank ?? "NEW"} · Peak {entry.peak} · {entry.weeksOn} wks
                </p>
              </div>
            </article>
          ))}
        </section>
      )}

      {kind === "tracks" && rest.length > 0 && (
        <section className="mt-8 rounded-3xl bg-card p-2 md:p-3">
          <div className="mb-1 hidden grid-cols-[2.5rem_2rem_minmax(0,1fr)_3rem_3rem_3rem_5.5rem] gap-2 px-2 text-xs tracking-wide text-muted-foreground uppercase md:grid">
            <span>#</span>
            <span />
            <span>Title</span>
            <span className="text-right">LW</span>
            <span className="text-right">Peak</span>
            <span className="text-right">Wks</span>
            <span className="text-right">SEU</span>
          </div>
          {rest.map((entry) => (
            <ChartTrackRow key={entry.track.id} entry={entry} queue={board.tracks} />
          ))}
        </section>
      )}

      {kind === "tracks" && board.tracks.length === 0 && (
        <p className="mt-16 text-sm text-muted-foreground">No ranked tracks in this room yet.</p>
      )}

      {kind === "artists" && board.artists.length > 0 && (
        <section className="mt-8 rounded-3xl bg-card p-2 md:p-3">
          <div className="mb-1 hidden grid-cols-[2.5rem_2rem_minmax(0,1fr)_3rem_3rem_5.5rem] gap-2 px-2 text-xs tracking-wide text-muted-foreground uppercase md:grid">
            <span>#</span>
            <span />
            <span>Artist</span>
            <span className="text-right">Peak</span>
            <span className="text-right">Wks</span>
            <span className="text-right">SEU</span>
          </div>
          {board.artists.map((entry) => (
            <ChartArtistRow key={entry.artist.id} entry={entry} />
          ))}
        </section>
      )}

      {kind === "artists" && board.artists.length === 0 && (
        <p className="mt-16 text-sm text-muted-foreground">No ranked artists in this room yet.</p>
      )}

      <aside className="mt-10 max-w-2xl text-sm text-muted-foreground">
        <p className="text-xs tracking-[0.2em] text-sand uppercase">How VerzZify Global 200 ranks</p>
        <ul className="mt-3 space-y-2">
          <li>
            Stream-equivalent units: <span className="text-foreground">SEU = (paid downloads × 200) + hosted streams</span>
            . One sale equals 200 streams.
          </li>
          <li>
            Hosted VerzZify streams count at full (premium) weight. There is no ad-supported discount on this board — VerzZify
            is not an ad-tier host.
          </li>
          <li>
            Global 200 includes every territory. Global Excl. US is the companion board with the United States removed, so
            a song can lead the world without leading America.
          </li>
          <li>
            Only official VerzZify-hosted tracks. YouTube promotions stay off this board. Radio is not counted — it is not
            measured the same way in every territory.
          </li>
          <li>
            Direct-to-fan downloads on VerzZify count. Industry charts that exclude D2C miss the sales this product exists
            to take.
          </li>
          <li>No recurrent rule. A title stays ranked as long as it still earns SEU — catalog is not flushed after 20 or 52 weeks.</li>
          <li>▲ ▼ vs last week. Peak and weeks stay on the song. Greatest gainer is the largest rank jump this week.</li>
        </ul>
        <Button variant="outline" className="mt-5" asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </aside>
    </div>
  );
}
