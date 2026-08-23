import { createFileRoute } from "@tanstack/react-router";

/**
 * ICE config for 1-1 video.
 * STUN finds a public mapping (srflx). TURN relays when both sides are
 * symmetric-NAT / firewall (relay). Host candidates are LAN-only.
 */
function iceServers(): RTCIceServer[] {
  const stun = (process.env.STUN_URLS || process.env.VITE_STUN_URLS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const servers: RTCIceServer[] = [
    {
      urls: stun.length ? stun : ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"],
    },
  ];
  const turnUrls = (process.env.TURN_URLS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const username = process.env.TURN_USERNAME?.trim();
  const credential = process.env.TURN_CREDENTIAL?.trim();
  if (turnUrls.length && username && credential) {
    servers.push({ urls: turnUrls, username, credential });
  }
  return servers;
}

export const Route = createFileRoute("/api/v1/ice")({
  server: {
    handlers: {
      GET: () =>
        Response.json(
          {
            iceServers: iceServers(),
            iceTransportPolicy: "all",
            iceCandidatePoolSize: 2,
            hasTurn: iceServers().some((s) =>
              (Array.isArray(s.urls) ? s.urls : [s.urls]).some((u) => String(u).startsWith("turn")),
            ),
          },
          { headers: { "access-control-allow-origin": "*", "cache-control": "no-store" } },
        ),
    },
  },
});

type RTCIceServer = { urls: string | string[]; username?: string; credential?: string };
