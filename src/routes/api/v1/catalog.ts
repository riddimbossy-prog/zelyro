import { createFileRoute } from "@tanstack/react-router";
import { catalogTaxonomy, loadCountryGenre } from "@/lib/verzzify/yt-catalog";
import { getViewerGeo } from "@/lib/verzzify/geo";
import { normalizeRegion } from "@/lib/verzzify/yt-charts";

export const Route = createFileRoute("/api/v1/catalog")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const genre = url.searchParams.get("genre")?.trim();
        if (!genre) {
          return Response.json(catalogTaxonomy(), {
            headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=3600" },
          });
        }
        const regionParam = url.searchParams.get("region");
        const region = regionParam ? normalizeRegion(regionParam) : (await getViewerGeo()).region;
        const data = await loadCountryGenre(region, genre);
        return Response.json(data, {
          headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=180" },
        });
      },
    },
  },
});
