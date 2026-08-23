import { createFileRoute } from "@tanstack/react-router";
import { getViewerGeo } from "@/lib/verzzify/geo";
import { loadYoutubeHome, normalizeRegion } from "@/lib/verzzify/yt-charts";

export const Route = createFileRoute("/api/v1/youtube")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const q = new URL(request.url).searchParams.get("region");
        const region = q ? normalizeRegion(q) : (await getViewerGeo()).region;
        const data = await loadYoutubeHome(region);
        return Response.json(data, {
          headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=120" },
        });
      },
    },
  },
});
