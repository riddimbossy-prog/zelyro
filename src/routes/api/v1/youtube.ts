import { createFileRoute } from "@tanstack/react-router";
import { loadYoutubeHome, normalizeRegion } from "@/lib/verzzify/yt-charts";

export const Route = createFileRoute("/api/v1/youtube")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const region = normalizeRegion(new URL(request.url).searchParams.get("region") || "GH");
        const data = await loadYoutubeHome(region);
        return Response.json(data, {
          headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=120" },
        });
      },
    },
  },
});
