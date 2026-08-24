import { createFileRoute } from "@tanstack/react-router";
import { extractVideoId, youtubeWatchUrl } from "@/lib/verzzify/youtube";
import { rapidKey, rapidMp3 } from "@/lib/verzzify/rapid-yt";

export const Route = createFileRoute("/api/v1/yt-mp3")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!rapidKey()) {
          return Response.json({ error: "RAPIDAPI_KEY is not set" }, { status: 503 });
        }
        const url = new URL(request.url);
        const raw = url.searchParams.get("videoId") || url.searchParams.get("url") || "";
        const id = extractVideoId(raw) ?? (raw.match(/^[a-zA-Z0-9_-]{11}$/) ? raw : null);
        if (!id) return Response.json({ error: "videoId required" }, { status: 400 });
        try {
          const meta = await rapidMp3(youtubeWatchUrl(id));
          if (url.searchParams.get("meta") === "1") {
            return Response.json(
              { videoId: id, ...meta },
              { headers: { "access-control-allow-origin": "*" } },
            );
          }
          const file = await fetch(meta.url);
          if (!file.ok || !file.body) {
            return Response.json({ error: "MP3 fetch failed" }, { status: 502 });
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
            { error: err instanceof Error ? err.message : "RapidAPI failed" },
            { status: 502 },
          );
        }
      },
    },
  },
});
