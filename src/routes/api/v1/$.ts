import { createFileRoute } from "@tanstack/react-router";
import { loadHome, buyTicket, buyLiveAccess, publishTrack, getEventPage, getLivePage, getLibrary, getCommunity, getNews, searchCatalog, becomeArtist } from "@/lib/verzzify/queries";
import { getCharts } from "@/lib/verzzify/charts";
import { createTicketEvent, createLiveStream, upsertVideoCall, createAlbum, createUserPlaylist } from "@/lib/verzzify/studio-actions";
import { getVideoSession, bookVideoCall, listOpenVideoRooms } from "@/lib/verzzify/video-actions";
import { searchDiscover } from "@/lib/verzzify/promotions";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: cors });
}

async function body(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function handle({ request }: { request: Request }) {
  const url = new URL(request.url);
  const parts = url.pathname.replace(/^\/api\/v1\/?/, "").split("/").filter(Boolean);
  const [a, b, c] = parts;
  try {
    if (request.method === "GET" && (!a || a === "home")) return json(await loadHome());
    if (request.method === "GET" && a === "search") {
      const q = url.searchParams.get("q") || "";
      const kind = url.searchParams.get("kind") || "songs";
      const catalog = await searchCatalog({ data: q });
      const yt = await searchDiscover({ data: { q, kind } });
      return json({ catalog, youtube: yt });
    }
    if (request.method === "GET" && a === "community") return json({ posts: await getCommunity() });
    if (request.method === "GET" && a === "charts") return json(await getCharts({ data: { scope: url.searchParams.get("scope") || "global" } }));
    if (request.method === "GET" && a === "news") return json({ articles: await getNews() });
    if (request.method === "GET" && a === "library") return json(await getLibrary());
    if (request.method === "GET" && a === "event" && b) return json(await getEventPage({ data: b }));
    if (request.method === "GET" && a === "live" && b) return json(await getLivePage({ data: b }));
    if (request.method === "GET" && a === "video" && b === "rooms") return json({ rooms: await listOpenVideoRooms() });
    if (request.method === "GET" && a === "video" && b) return json(await getVideoSession({ data: b }));
    if (request.method === "POST" && a === "ticket") {
      const d = await body(request);
      return json(await buyTicket({ data: String(d.typeId || d.id) }));
    }
    if (request.method === "POST" && a === "live" && b === "buy") {
      const d = await body(request);
      return json(await buyLiveAccess({ data: String(d.liveId || d.id) }));
    }
    if (request.method === "POST" && a === "tracks") {
      const d = (await body(request)) as Record<string, unknown>;
      await becomeArtist({ data: { artistName: String(d.artistName || "You"), bio: "", country: "GH", genres: String(d.genre || "Beats") } });
      return json(await publishTrack({ data: d as never }));
    }
    if (request.method === "POST" && a === "events") {
      return json(await createTicketEvent({ data: (await body(request)) as never }));
    }
    if (request.method === "POST" && a === "live") {
      return json(await createLiveStream({ data: (await body(request)) as never }));
    }
    if (request.method === "POST" && a === "video" && b === "open") {
      return json(await upsertVideoCall({ data: (await body(request)) as never }));
    }
    if (request.method === "POST" && a === "video" && b === "book") {
      const d = await body(request);
      return json(await bookVideoCall({ data: { artistId: String(d.artistId) } }));
    }
    if (request.method === "POST" && a === "albums") {
      return json(await createAlbum({ data: (await body(request)) as never }));
    }
    if (request.method === "POST" && a === "playlists") {
      return json(await createUserPlaylist({ data: (await body(request)) as never }));
    }
    return json({ error: "not found", path: parts, extra: c }, 404);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "failed" }, 400);
  }
}

export const Route = createFileRoute("/api/v1/$")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: cors }),
      GET: handle,
      POST: handle,
    },
  },
});
