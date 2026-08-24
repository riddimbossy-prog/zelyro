import { Link } from "@tanstack/react-router";
import type { MarketTicket } from "@/lib/verzzify/tickets-market";

export function TicketCard({ t }: { t: MarketTicket }) {
  const when = (() => {
    try {
      return new Date(t.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  })();
  return (
    <Link to="/event/$id" params={{ id: t.id }} className="min-w-[168px] max-w-[200px] shrink-0">
      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-white/10">
        <div className="relative aspect-[3/4]">
          <img src={t.posterUrl} alt="" className="size-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="text-[10px] font-extrabold tracking-widest text-primary uppercase">{t.popular ? "Popular" : t.scope}</p>
            <p className="truncate font-display text-sm font-semibold">{t.title}</p>
          </div>
        </div>
        <div className="px-3 py-2">
          <p className="truncate text-xs text-muted-foreground">
            {t.city} · {when}
          </p>
          <p className="truncate text-[11px] text-white/70">{t.venue}</p>
        </div>
      </div>
    </Link>
  );
}
