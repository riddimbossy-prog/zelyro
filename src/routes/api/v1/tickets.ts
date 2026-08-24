import { createFileRoute } from "@tanstack/react-router";
import { getViewerGeo } from "@/lib/verzzify/geo";
import { getMarketTicket, loadTicketMarket } from "@/lib/verzzify/tickets-market";
import { normalizeRegion } from "@/lib/verzzify/yt-charts";

export const Route = createFileRoute("/api/v1/tickets")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (id) {
          const event = getMarketTicket(id);
          return Response.json(
            { event },
            { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=60" } },
          );
        }
        const regionParam = url.searchParams.get("region");
        const region = regionParam ? normalizeRegion(regionParam) : (await getViewerGeo()).region;
        const data = await loadTicketMarket(region);
        return Response.json(data, {
          headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=120" },
        });
      },
    },
  },
});
