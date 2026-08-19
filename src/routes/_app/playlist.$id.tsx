import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPlaylistPage } from "@/lib/sheba/queries";
import { usePlayer } from "@/lib/sheba/player";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export const Route = createFileRoute("/_app/playlist/$id")({ component: PlaylistPage });

function PlaylistPage() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["playlist", id], queryFn: () => getPlaylistPage({ data: id }) });
  const play = usePlayer((s) => s.play);
  if (!q.data) return <div className="h-64 animate-pulse rounded-3xl bg-secondary" />;
  const { playlist, tracks } = q.data;
  return (
    <div>
      <p className="text-xs tracking-widest text-muted-foreground uppercase">{playlist.kind}</p>
      <h1 className="mt-2 font-display text-4xl">{playlist.title}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">{playlist.description}</p>
      <Button className="mt-6" onClick={() => play(tracks, 0)}>
        <Play className="size-4 fill-current" /> Play
      </Button>
      <div className="mt-6">
        {tracks.map((t, i) => (
          <TrackRow key={t.id} track={t} queue={tracks} index={i} />
        ))}
      </div>
    </div>
  );
}
