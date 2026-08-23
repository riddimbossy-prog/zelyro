import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAlbumPage } from "@/lib/verzzify/queries";
import { usePlayer } from "@/lib/verzzify/player";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export const Route = createFileRoute("/_app/album/$id")({ component: AlbumPage });

function AlbumPage() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["album", id], queryFn: () => getAlbumPage({ data: id }) });
  const play = usePlayer((s) => s.play);
  if (!q.data) return <div className="h-64 animate-pulse rounded-3xl bg-secondary" />;
  const { album, tracks } = q.data;
  return (
    <div className="grid gap-8 md:grid-cols-[240px_minmax(0,1fr)]">
      <div>
        <img src={album.coverUrl} alt="" className="w-full rounded-3xl object-cover" />
        <Button className="mt-4 w-full" onClick={() => play(tracks, 0)}>
          <Play className="size-4 fill-current" /> Play
        </Button>
      </div>
      <div>
        <p className="text-xs tracking-widest text-muted-foreground uppercase">{album.albumType}</p>
        <h1 className="mt-2 font-display text-4xl">{album.title}</h1>
        <Link to="/artist/$slug" params={{ slug: album.artistSlug }} className="text-muted-foreground">
          {album.artistName}
        </Link>
        <div className="mt-6">
          {tracks.map((t, i) => (
            <TrackRow key={t.id} track={t} queue={tracks} index={i} showArtist={false} />
          ))}
        </div>
      </div>
    </div>
  );
}
