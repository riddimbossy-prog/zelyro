import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPost, getCommunity, getHomeData } from "@/lib/verzzify/queries";
import { getActivePromotions } from "@/lib/verzzify/promotions";
import { listOpenVideoRooms } from "@/lib/verzzify/video-actions";
import { usePlayer } from "@/lib/verzzify/player";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useState } from "react";
import { toast } from "sonner";
import { Play, Video } from "lucide-react";
import { YouTubePromotionCard } from "@/components/youtube-promotion-card";
import { CreatorStudio } from "@/components/creator-studio";
import { CommunitySearch } from "@/components/community-search";
import { formatMoney } from "@/lib/utils";

const SEED_POSTS = [
  {
    id: "seed-1",
    authorName: "VerzZify",
    authorSlug: "verzzify",
    authorAvatar: "/icon-256.png",
    body: "Welcome to Community — share a release, a night out, or a track that carried you. Studio creators post here first.",
    createdAt: new Date().toISOString(),
    imageUrl: null as string | null,
    track: null as null,
  },
  {
    id: "seed-2",
    authorName: "VerzZify Charts",
    authorSlug: "verzzify",
    authorAvatar: "/icon-256.png",
    body: "Regional charts update from your location. Drop a city + genre in the comments (via a post) and we’ll surface more of that scene.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    imageUrl: null,
    track: null,
  },
];

export const Route = createFileRoute("/_app/community")({
  loader: async () => {
    const [home, rooms] = await Promise.all([getHomeData(), listOpenVideoRooms()]);
    return { home, rooms };
  },
  component: Community,
});

function Community() {
  const user = useCurrentUser();
  const qc = useQueryClient();
  const data = Route.useLoaderData();
  const home = data.home;
  const q = useQuery({ queryKey: ["community"], queryFn: () => getCommunity() });
  const promoted = useQuery({ queryKey: ["promoted-home"], queryFn: () => getActivePromotions() });
  const rooms = useQuery({
    queryKey: ["video-open"],
    queryFn: () => listOpenVideoRooms(),
    initialData: data.rooms,
  });
  const [body, setBody] = useState("");
  const play = usePlayer((s) => s.play);
  const posts = (q.data && q.data.length > 0 ? q.data : SEED_POSTS) as typeof SEED_POSTS;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl">Community</h1>
      <p className="mt-1 text-sm text-muted-foreground">Studio, releases, and the people who make the sound.</p>
      <div className="mt-5">
        <CommunitySearch
          artists={home?.artists ?? []}
          posts={q.data ?? []}
          tracks={home?.newest ?? []}
          rooms={rooms.data ?? []}
        />
      </div>
      <CreatorStudio newest={home?.newest ?? []} />
      {(rooms.data ?? []).length > 0 && (
        <section className="mt-10">
          <p className="text-xs tracking-widest text-sand uppercase">1-1 now</p>
          <h2 className="font-display text-lg">Video chat waiting rooms</h2>
          <ul className="mt-3 space-y-2">
            {(rooms.data ?? []).map((r) => (
              <li key={r.id}>
                <Link
                  to="/video/$id"
                  params={{ id: r.id }}
                  className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3"
                >
                  <img src={r.artistAvatar ?? "/favicon.svg"} alt="" className="size-12 rounded-full object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.artistName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {r.durationMin} min · {formatMoney(r.priceCents, r.currency)} · {r.status}
                    </span>
                  </span>
                  <Video className="size-4 text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {(promoted.data ?? []).length > 0 && (
        <section className="mt-10">
          <p className="text-xs tracking-widest text-sand uppercase">Sponsored</p>
          <h2 className="font-display text-lg">Promoted Music</h2>
          <div className="mt-3 space-y-3">
            {(promoted.data ?? []).slice(0, 3).map((p) => (
              <YouTubePromotionCard key={p.campaignId} promo={p} compact />
            ))}
          </div>
        </section>
      )}
      {user ? (
        <form
          className="mt-8 rounded-3xl bg-card p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await createPost({ data: body });
              setBody("");
              void qc.invalidateQueries({ queryKey: ["community"] });
            } catch {
              toast("Could not post");
            }
          }}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Share a night, a release, a thought…"
            className="w-full resize-none bg-transparent text-sm outline-none"
          />
          <div className="mt-2 flex justify-end">
            <Button type="submit" size="sm" disabled={!body.trim()}>
              Post
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-8 rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
          <Link to="/login" className="text-primary underline">
            Sign in
          </Link>{" "}
          to post. You can still browse the feed below.
        </p>
      )}
      <ul className="mt-6 space-y-4">
        {posts.map((p) => (
          <li key={p.id} className="rounded-3xl bg-card p-5">
            <div className="flex items-center gap-3">
              <img src={p.authorAvatar ?? "/favicon.svg"} alt="" className="size-10 rounded-full object-cover" />
              <div>
                <Link to="/artist/$slug" params={{ slug: p.authorSlug }} className="text-sm font-medium">
                  {p.authorName}
                </Link>
                <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{p.body}</p>
            {"imageUrl" in p && p.imageUrl && (
              <img src={p.imageUrl} alt="" className="mt-3 max-h-80 w-full rounded-2xl object-cover" />
            )}
            {"track" in p && p.track && (
              <button
                type="button"
                onClick={() => play([p.track!], 0)}
                className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-secondary p-2 text-left"
              >
                <img src={p.track.coverUrl} alt="" className="size-12 rounded-lg object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{p.track.title}</span>
                  <span className="block text-xs text-muted-foreground">{p.track.artistName}</span>
                </span>
                <Play className="size-4 fill-current" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
