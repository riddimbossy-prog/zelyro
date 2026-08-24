import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { buyTicket, getEventPage } from "@/lib/verzzify/queries";
import { getMarketTicket } from "@/lib/verzzify/tickets-market";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/event/$id")({ component: EventPage });

function EventPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const market = getMarketTicket(id);
  const q = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventPage({ data: id }),
    retry: false,
    enabled: !market,
  });

  if (market) {
    return (
      <div className="grid gap-8 md:grid-cols-[280px_minmax(0,1fr)]">
        <img src={market.posterUrl} alt="" className="w-full rounded-3xl object-cover" />
        <div>
          <p className="text-xs tracking-widest text-sand uppercase">Live night</p>
          <h1 className="mt-2 font-display text-4xl">{market.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {market.venue} · {market.city}
            {market.country ? ` · ${market.country}` : ""} ·{" "}
            {new Date(market.startsAt).toLocaleString()}
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed">
            {market.artist} on VerzZify’s ticket board. Official inventory is sold by the venue or partner
            — we deep-link you when a ticket URL is available.
          </p>
          {market.ticketUrl ? (
            <Button className="mt-6" asChild>
              <a href={market.ticketUrl} target="_blank" rel="noreferrer">
                Buy tickets
              </a>
            </Button>
          ) : (
            <div className="mt-6 space-y-2">
              <Button disabled>Tickets link pending</Button>
              <p className="text-xs text-muted-foreground">
                Live partners haven’t published a buy link yet. Check back or open Tickets for other dates.
              </p>
            </div>
          )}
          <p className="mt-8">
            <Link to="/tickets" className="text-sm text-primary underline">
              ← All tickets
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (q.isPending) return <div className="h-64 animate-pulse rounded-3xl bg-secondary" />;
  if (!q.data) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-2xl">Event not found</p>
        <Link to="/tickets" className="mt-4 inline-block text-primary underline">
          Browse tickets
        </Link>
      </div>
    );
  }
  const { event, types } = q.data;
  return (
    <div className="grid gap-8 md:grid-cols-[280px_minmax(0,1fr)]">
      <img src={event.posterUrl} alt="" className="w-full rounded-3xl object-cover" />
      <div>
        <p className="text-xs tracking-widest text-sand uppercase">Live night</p>
        <h1 className="mt-2 font-display text-4xl">{event.title}</h1>
        <p className="mt-2 text-muted-foreground">
          {event.venue} · {event.city} · {new Date(event.startsAt).toLocaleString()}
        </p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed">{event.description}</p>
        {event.ticketUrl ? (
          <Button className="mt-6" asChild>
            <a href={event.ticketUrl} target="_blank" rel="noreferrer">
              Get tickets
            </a>
          </Button>
        ) : null}
        <ul className="mt-8 space-y-3">
          {types.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-2xl bg-card p-4">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.sold}/{t.capacity} sold · {formatMoney(t.priceCents, t.currency)}
                </p>
              </div>
              <Button
                size="sm"
                disabled={t.sold >= t.capacity}
                onClick={async () => {
                  try {
                    const r = await buyTicket({ data: t.id });
                    toast(`Ticket ${r.code} is in My Tickets`);
                    void qc.invalidateQueries({ queryKey: ["event", id] });
                  } catch (e) {
                    toast(
                      e instanceof Error && e.message === "Unauthorized"
                        ? "Sign in to buy tickets"
                        : "Could not buy ticket",
                    );
                  }
                }}
              >
                Buy
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
