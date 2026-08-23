import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { buyTicket, getEventPage } from "@/lib/verzzify/queries";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/event/$id")({ component: EventPage });

function EventPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["event", id], queryFn: () => getEventPage({ data: id }) });
  if (!q.data) return <div className="h-64 animate-pulse rounded-3xl bg-secondary" />;
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
                    toast(e instanceof Error && e.message === "Unauthorized" ? "Sign in to buy tickets" : "Could not buy ticket");
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
