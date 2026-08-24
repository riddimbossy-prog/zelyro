import { createFileRoute } from "@tanstack/react-router";
import { getViewerGeo } from "@/lib/verzzify/geo";
import { searchMusicDetailed } from "@/lib/verzzify/youtube";
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
          const result = await searchMusicDetailed(q.slice(0, 120), {
            regionCode: region,
            maxResults: 36,
            musicOnly: false,
          });
          return Response.json(
            {
              query: q,
              region,
              source: result.api,
              keyConfigured: result.keyConfigured,
              error: result.error ?? null,
              httpStatus: result.httpStatus ?? null,
              count: result.videos.length,
              videos: result.videos,
            },
            {
              headers: {
                "access-control-allow-origin": "*",
                "cache-control": "public, max-age=30",
              },
            },
          );
        }

        const data = await loadYoutubeHome(region);
        return Response.json(
          { ...data, source: "youtube-data-api-v3" },
          {
            headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=120" },
          },
        );
      },
    },
  },
});
