import { createFileRoute } from "@tanstack/react-router";
import { getViewerGeo } from "@/lib/verzzify/geo";
import { searchMusic } from "@/lib/verzzify/youtube";
import { loadYoutubeHome, normalizeRegion } from "@/lib/verzzify/yt-charts";

export const Route = createFileRoute("/api/v1/youtube")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get("q")?.trim();
        const regionParam = url.searchParams.get("region");
        const region = regionParam
          ? normalizeRegion(regionParam)
          : (await getViewerGeo().catch(() => ({ region: "US" }))).region;

        if (q) {
          const videos = await searchMusic(q.slice(0, 120), {
            regionCode: region,
            maxResults: 36,
            musicOnly: false,
          });
          return Response.json(
            { query: q, region, source: "verzzify", videos },
            {
              headers: {
                "access-control-allow-origin": "*",
                "cache-control": "public, max-age=60",
              },
            },
          );
        }

        const data = await loadYoutubeHome(region);
        return Response.json(data, {
          headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=120" },
        });
      },
    },
  },
});
