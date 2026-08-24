import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TicketCard } from "@/components/ticket-card";
import { getTicketMarket, type TicketMarket } from "@/lib/verzzify/tickets-market";
import { getViewerGeo } from "@/lib/verzzify/geo";
import { CATALOG_COUNTRIES } from "@/lib/verzzify/yt-catalog";

export const Route = createFileRoute("/_app/tickets")({
  loader: async () => {
    const geo = await getViewerGeo();
    return getTicketMarket({ data: geo.region });
  },
  component: TicketsMarket,
});

function TicketsMarket() {
  const initial = Route.useLoaderData() as TicketMarket;
  const [region, setRegion] = useState(initial.region);
  const q = useQuery({
    queryKey: ["tickets", region],
    queryFn: () => getTicketMarket({ data: region }),
    initialData: region === initial.region ? initial : undefined,
  });
  const data = q.data ?? initial;

  return (
    <div className="pb-16">
      <p className="kicker">Doors open</p>
      <h1 className="mt-1 font-display text-4xl font-extrabold">Nights</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Your city first. Only the rooms that matter worldwide — stadiums, arenas, names on the wave.
      </p>
      {!data.live && (
        <p className="mt-3 text-xs text-amber-300">Live concert feed needs RAPIDAPI_KEY on Render. Showing the VerzZify starter board until then.</p>
      )}
      {data.live && data.error && (
        <p className="mt-3 text-xs text-amber-300">Concert API: {data.error}</p>
      )}
      {data.live && !data.local.length && !data.global.length && (
        <p className="mt-3 text-xs text-muted-foreground">No live dates returned for this country yet — try another country chip.</p>
      )}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {CATALOG_COUNTRIES.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setRegion(c.code)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
              region === c.code ? "bg-primary text-primary-foreground ring-primary" : "bg-white/5 ring-white/15"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <section className="mt-8">
        <p className="kicker">In {data.regionName}</p>
        <h2 className="font-display text-2xl font-extrabold">Local doors</h2>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {data.local.map((t) => (
            <TicketCard key={t.id} t={t} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <p className="kicker">Worldwide</p>
        <h2 className="font-display text-2xl font-extrabold">Popular tickets</h2>
        <p className="mt-1 text-sm text-muted-foreground">Stadium heat only — not every club flyer.</p>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {data.global.map((t) => (
            <TicketCard key={t.id} t={t} />
          ))}
        </div>
      </section>
    </div>
  );
}
