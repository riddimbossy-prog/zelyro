import { createFileRoute } from "@tanstack/react-router";
import {
  getJamendoTrack,
  jamendoConfigured,
  jamendoToTrack,
  loadJamendoHome,
  searchJamendoTracks,
  JAMENDO_MOODS,
} from "@/lib/verzzify/jamendo";

export const Route = createFileRoute("/api/v1/jamendo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!jamendoConfigured()) {
          return Response.json(
            { error: "JAMENDO_CLIENT_ID is not set", configured: false },
            { status: 503 },
          );
        }

        const url = new URL(request.url);
        const id = url.searchParams.get("id")?.trim();
        const stream = url.searchParams.get("stream") === "1";
        const q = url.searchParams.get("q")?.trim();
        const mood = url.searchParams.get("mood")?.trim();
        const tags = url.searchParams.get("tags")?.trim();

        // Proxy stream for a single track (when direct audio URL not used)
        if (id && stream) {
          try {
            const track = await getJamendoTrack(id);
            const src = track?.audio || track?.audiodownload;
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
                "content-disposition": `inline; filename="jm_${id}.mp3"`,
              },
            });
          } catch (err) {
            return Response.json(
              { error: err instanceof Error ? err.message : "stream failed" },
              { status: 502 },
            );
          }
        }

        if (id) {
          try {
            const track = await getJamendoTrack(id);
            if (!track) return Response.json({ error: "not found" }, { status: 404 });
            return Response.json(
              { track: jamendoToTrack(track), raw: track },
              { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=300" } },
            );
          } catch (err) {
            return Response.json(
              { error: err instanceof Error ? err.message : "lookup failed" },
              { status: 502 },
            );
          }
        }

        if (q) {
          try {
            const tracks = await searchJamendoTracks({ q, limit: 24 });
            return Response.json(
              { query: q, source: "jamendo", count: tracks.length, tracks: tracks.map(jamendoToTrack) },
              { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=120" } },
            );
          } catch (err) {
            return Response.json(
              { error: err instanceof Error ? err.message : "search failed" },
              { status: 502 },
            );
          }
        }

        if (mood) {
          const m = JAMENDO_MOODS.find((x) => x.id === mood);
          try {
            const tracks = await searchJamendoTracks({
              tags: m?.tags || tags || mood,
              limit: 20,
            });
            return Response.json(
              {
                mood,
                label: m?.label ?? mood,
                source: "jamendo",
                tracks: tracks.map(jamendoToTrack),
              },
              { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=180" } },
            );
          } catch (err) {
            return Response.json(
              { error: err instanceof Error ? err.message : "mood failed" },
              { status: 502 },
            );
          }
        }

        const pack = await loadJamendoHome();
        return Response.json(
          { source: "jamendo", ...pack },
          { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=180" } },
        );
      },
    },
  },
});
