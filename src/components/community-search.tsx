import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { ArtistTile } from "@/components/cover-card";
import type { ArtistCard, PostCard, TrackCard } from "@/lib/verzzify/types";

type Room = {
  id: string;
  artistName: string;
  artistAvatar: string | null;
  durationMin: number;
  status: string;
};

export function CommunitySearch({
  artists = [],
  posts = [],
  tracks = [],
  rooms = [],
}: {
  artists?: ArtistCard[];
  posts?: PostCard[];
  tracks?: TrackCard[];
  rooms?: Room[];
}) {
  const [q, setQ] = useState("");
  const n = q.trim().toLowerCase();
  const hits = useMemo(() => {
    if (n.length < 1) return null;
    return {
      artists: artists.filter((a) => a.name.toLowerCase().includes(n) || a.slug.toLowerCase().includes(n)),
      posts: posts.filter((p) => p.body.toLowerCase().includes(n) || p.authorName.toLowerCase().includes(n)),
      tracks: tracks.filter(
        (t) => t.title.toLowerCase().includes(n) || t.artistName.toLowerCase().includes(n) || (t.genre ?? "").toLowerCase().includes(n),
      ),
      rooms: rooms.filter((r) => r.artistName.toLowerCase().includes(n)),
    };
  }, [n, artists, posts, tracks, rooms]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search people, posts, rooms"
          className="h-12 rounded-full pl-9"
        />
      </div>
      {hits && (
        <div className="mt-5 space-y-6">
          {hits.artists.length > 0 && (
            <div>
              <p className="mb-3 text-xs tracking-widest text-sand uppercase">People</p>
              <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                {hits.artists.map((a) => (
                  <ArtistTile key={a.id} id={a.id} slug={a.slug} name={a.name} avatarUrl={a.avatarUrl} verified={a.verified} />
                ))}
              </div>
            </div>
          )}
          {hits.rooms.length > 0 && (
            <div>
              <p className="mb-2 text-xs tracking-widest text-sand uppercase">Rooms</p>
              <ul className="space-y-2">
                {hits.rooms.map((r) => (
                  <li key={r.id}>
                    <Link to="/video/$id" params={{ id: r.id }} className="flex items-center gap-3 rounded-2xl bg-card px-3 py-2 text-sm">
                      <img src={r.artistAvatar ?? "/favicon.svg"} alt="" className="size-9 rounded-full object-cover" />
                      {r.artistName}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hits.posts.length > 0 && (
            <div>
              <p className="mb-2 text-xs tracking-widest text-sand uppercase">Posts</p>
              <ul className="space-y-2">
                {hits.posts.map((p) => (
                  <li key={p.id} className="rounded-2xl bg-card p-3 text-sm">
                    <p className="font-medium">{p.authorName}</p>
                    <p className="mt-1 text-muted-foreground">{p.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hits.tracks.length > 0 && (
            <div>
              <p className="mb-2 text-xs tracking-widest text-sand uppercase">Drops</p>
              <ul className="space-y-1 text-sm">
                {hits.tracks.map((t) => (
                  <li key={t.id}>
                    <Link to="/track/$id" params={{ id: t.id }} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                      <img src={t.coverUrl} alt="" className="size-10 rounded-lg object-cover" />
                      <span>
                        <span className="block">{t.title}</span>
                        <span className="text-xs text-muted-foreground">{t.artistName}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hits.artists.length + hits.posts.length + hits.tracks.length + hits.rooms.length === 0 && (
            <p className="text-sm text-muted-foreground">Nobody matched “{q}”.</p>
          )}
        </div>
      )}
    </div>
  );
}
