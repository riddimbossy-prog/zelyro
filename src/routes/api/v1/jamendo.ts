import { createFileRoute } from "@tanstack/react-router";
import {
  getJamendoTrack,
  jamendoConfigured,
  jamendoToTrack,
  loadJamendoHome,
  pingJamendo,
  searchJamendoTracks,
  JAMENDO_MOODS,
} from "@/lib/verzzify/jamendo";

const cors = { "access-control-allow-origin": "*" };

export const Route = createFileRoute("/api/v1/jamendo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const debug = url.searchParams.get("debug") === "1";
        if (debug) {
          return Response.json(await pingJamendo(), { headers: cors });
        }

        if (!jamendoConfigured()) {
          return Response.json(
            { error: "JAMENDO_CLIENT_ID is not set", configured: false },
            { status: 503, headers: cors },
          );
        }

        const id = url.searchParams.get("id")?.trim();
        const stream = url.searchParams.get("stream") === "1";
        const q = url.searchParams.get("q")?.trim();
        const mood = url.searchParams.get("mood")?.trim();
        const tags = url.searchParams.get("tags")?.trim();

        if (id && stream) {
          try {
            const track = await getJamendoTrack(id);
            const src = track?.audio || track?.audiodownload;
            if (!src) return Response.json({ error: "no stream" }, { status: 404, headers: cors });
            const range = request.headers.get("range");
            const file = await fetch(src, {
              headers: range ? { range } : undefined,
              signal: AbortSignal.timeout(25000),
            });
            if (!file.ok || !file.body) {
              return Response.json({ error: "upstream audio failed" }, { status: 502, headers: cors });
            }
            const headers = new Headers();
            headers.set("content-type", file.headers.get("content-type") || "audio/mpeg");
            headers.set("cache-control", "private, max-age=3600");
            headers.set("access-control-allow-origin", "*");
            headers.set("accept-ranges", "bytes");
            headers.set("content-disposition", `inline; filename="jm_${id}.mp3"`);
            const cr = file.headers.get("content-range");
            const cl = file.headers.get("content-length");
            if (cr) headers.set("content-range", cr);
            if (cl) headers.set("content-length", cl);
            return new Response(file.body, { status: file.status, headers });
          } catch (err) {
            return Response.json(
              { error: err instanceof Error ? err.message : "stream failed" },
              { status: 502, headers: cors },
            );
          }
        }

        if (id) {
          try {
            const track = await getJamendoTrack(id);
            if (!track) return Response.json({ error: "not found" }, { status: 404, headers: cors });
            return Response.json(
              { track: jamendoToTrack(track), raw: track },
              { headers: { ...cors, "cache-control": "public, max-age=300" } },
            );
          } catch (err) {
            return Response.json(
              { error: err instanceof Error ? err.message : "lookup failed" },
              { status: 502, headers: cors },
            );
          }
        }

        if (q) {
          try {
            const tracks = await searchJamendoTracks({ q, limit: 24 });
            return Response.json(
              { query: q, source: "jamendo", count: tracks.length, tracks: tracks.map(jamendoToTrack) },
              { headers: { ...cors, "cache-control": "public, max-age=60" } },
            );
          } catch (err) {
            return Response.json(
              { error: err instanceof Error ? err.message : "search failed", query: q, tracks: [] },
              { status: 502, headers: cors },
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
              { mood, label: m?.label ?? mood, source: "jamendo", tracks: tracks.map(jamendoToTrack) },
              { headers: { ...cors, "cache-control": "public, max-age=120" } },
            );
          } catch (err) {
            return Response.json(
              { error: err instanceof Error ? err.message : "mood failed", tracks: [] },
              { status: 502, headers: cors },
            );
          }
        }

        const pack = await loadJamendoHome();
        return Response.json(
          { source: "jamendo", ...pack },
          { headers: { ...cors, "cache-control": "public, max-age=60" } },
        );
      },
    },
  },
});
