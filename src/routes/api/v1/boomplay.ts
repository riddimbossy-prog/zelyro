import { createFileRoute } from "@tanstack/react-router";
import { getViewerGeo } from "@/lib/verzzify/geo";
import {
  boomplayConfigured,
  boomplayToTrack,
  getBoomplaySong,
  loadBoomplayHome,
  searchBoomplay,
} from "@/lib/verzzify/boomplay";

export const Route = createFileRoute("/api/v1/boomplay")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get("q")?.trim();
        const id = url.searchParams.get("id")?.trim();

        if (id && !q) {
          if (!boomplayConfigured()) {
            return Response.json({ error: "RAPIDAPI_KEY is not set" }, { status: 503 });
          }
          try {
            const song = await getBoomplaySong(id);
            const src = url.searchParams.get("quality") === "hd" ? song?.hdUrl || song?.mdUrl : song?.mdUrl || song?.hdUrl;
            if (!src) return Response.json({ error: "no stream" }, { status: 404 });
            const file = await fetch(src, { signal: AbortSignal.timeout(20000) });
            if (!file.ok || !file.body) {
              return Response.json({ error: "upstream audio failed" }, { status: 502 });
            }
            return new Response(file.body, {
              headers: {
                "content-type": file.headers.get("content-type") || "audio/mpeg",
                "cache-control": "private, max-age=3600",
                "access-control-allow-origin": "*",
                "content-disposition": `inline; filename="${id}.mp3"`,
              },
            });
          } catch (err) {
            return Response.json(
              { error: err instanceof Error ? err.message : "boomplay stream failed" },
              { status: 502 },
            );
          }
        }

        if (q) {
          try {
            const songs = await searchBoomplay(q, url.searchParams.get("type") || "music");
            return Response.json(
              { query: q, tracks: songs.map(boomplayToTrack) },
              { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=120" } },
            );
          } catch (err) {
            return Response.json({ error: err instanceof Error ? err.message : "search failed" }, { status: 502 });
          }
        }

        const region = url.searchParams.get("region") || (await getViewerGeo()).region;
        const pack = await loadBoomplayHome(region);
        return Response.json(
          { region: pack.region, tracks: pack.popular, fresh: pack.fresh },
          { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=180" } },
        );
      },
    },
  },
});
