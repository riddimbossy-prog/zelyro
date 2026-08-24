import { useQuery } from "@tanstack/react-query";
import { TicketCard } from "@/components/ticket-card";
import { getTicketMarket } from "@/lib/verzzify/tickets-market";
import { getViewerGeo } from "@/lib/verzzify/geo";
import { SectionRail } from "@/components/section-rail";

export function TicketsRail() {
  const q = useQuery({
    queryKey: ["tickets-home"],
    queryFn: async () => {
      const geo = await getViewerGeo();
      return getTicketMarket({ data: geo.region });
    },
  });
  const local = q.data?.local ?? [];
  const global = (q.data?.global ?? []).filter((t) => t.popular).slice(0, 8);
  if (!local.length && !global.length) return null;
  return (
    <>
      {local.length > 0 && (
        <SectionRail title={`Tickets in ${q.data?.regionName ?? "your country"}`} to="/tickets">
          {local.slice(0, 8).map((t) => (
            <TicketCard key={t.id} t={t} />
          ))}
        </SectionRail>
      )}
      {global.length > 0 && (
        <SectionRail title="Popular tickets worldwide" to="/tickets">
          {global.map((t) => (
            <TicketCard key={t.id} t={t} />
          ))}
        </SectionRail>
      )}
    </>
  );
}
