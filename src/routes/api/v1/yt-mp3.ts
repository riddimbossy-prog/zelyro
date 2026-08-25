import { createFileRoute } from "@tanstack/react-router";

/**
 * YouTube audiovisual content must not be downloaded or offered offline
 * without YouTube's prior written approval (Developer Policies).
 * This route is intentionally disabled so quota reviews see embed-only use.
 */
export const Route = createFileRoute("/api/v1/yt-mp3")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          {
            error:
              "YouTube downloads are not available. Play YouTube content only through the official player.",
            code: "YOUTUBE_DOWNLOAD_DISABLED",
          },
          {
            status: 410,
            headers: {
              "access-control-allow-origin": "*",
              "cache-control": "public, max-age=3600",
            },
          },
        ),
    },
  },
});
