import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addComment, getTrackPage, purchaseTrack } from "@/lib/verzzify/queries";
import { usePlayer } from "@/lib/verzzify/player";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import { Play } from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/_app/track/$id")({ component: TrackPage });

function TrackPage() {
  const { id } = Route.useParams();
  const user = useCurrentUser();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["track", id], queryFn: () => getTrackPage({ data: id }) });
  const play = usePlayer((s) => s.play);
  const [body, setBody] = useState("");
  if (q.isPending) return <div className="h-64 animate-pulse rounded-3xl bg-secondary" />;
  if (!q.data) return <p className="py-16">Track not found.</p>;
  const { track, comments, related } = q.data;
  const canBuy = (track.distribution === "paid_download" || track.distribution === "premium") && !track.purchased;
  const canDownload =
    track.distribution === "free_download" ||
    (track.purchased && (track.distribution === "premium" || track.distribution === "paid_download"));

  return (
    <div className="grid gap-10 md:grid-cols-[280px_minmax(0,1fr)]">
      <div>
        <img src={track.coverUrl} alt="" className="w-full rounded-3xl object-cover" />
        <Button className="mt-4 w-full" onClick={() => play([track, ...related], 0)}>
          <Play className="size-4 fill-current" /> Play
        </Button>
        {canBuy && (
          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={async () => {
              try {
                const r = await purchaseTrack({
                  data: { trackId: track.id, license: track.distribution === "premium" ? "premium" : "basic" },
                });
                toast(r.rights ?? "Purchased");
                void qc.invalidateQueries({ queryKey: ["track", id] });
              } catch {
                toast("Sign in to buy");
              }
            }}
          >
            Buy {formatMoney(track.priceCents, track.currency)}
          </Button>
        )}
        {canDownload && (
          <a href={track.audioUrl} download className="mt-2 block text-center text-sm text-primary">
            Download authorized file
          </a>
        )}
      </div>
      <div>
        <p className="text-xs tracking-widest text-sand uppercase">{track.genre}</p>
        <h1 className="mt-2 font-display text-4xl">{track.title}</h1>
        <Link to="/artist/$slug" params={{ slug: track.artistSlug }} className="mt-1 inline-block text-muted-foreground">
          {track.artistName}
          {track.verified ? " · Verified" : ""}
        </Link>
        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Distribution</dt>
            <dd className="capitalize">{track.distribution.replaceAll("_", " ")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Copyright</dt>
            <dd>{track.copyrightOwner}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Producer</dt>
            <dd>{track.producer}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Writer</dt>
            <dd>{track.songwriter}</dd>
          </div>
        </dl>
        <p className="mt-6 text-sm text-muted-foreground">
          A purchase is a license, not a transfer of copyright. Premium downloads are only issued when the
          artist enabled them.
        </p>
        <h2 className="mt-10 font-display text-xl">Comments</h2>
        {user && (
          <form
            className="mt-3 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await addComment({ data: { targetType: "track", targetId: id, body } });
                setBody("");
                void qc.invalidateQueries({ queryKey: ["track", id] });
              } catch {
                toast("Could not comment");
              }
            }}
          >
            <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="A line about the record…" />
            <Button type="submit">Send</Button>
          </form>
        )}
        <ul className="mt-4 space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="text-sm">
              <span className="font-medium">{c.name}</span>
              <span className="ml-2 text-muted-foreground">{c.body}</span>
            </li>
          ))}
        </ul>
        <h2 className="mt-10 font-display text-xl">More like this</h2>
        <div className="mt-3">
          {related.map((t, i) => (
            <TrackRow key={t.id} track={t} queue={related} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
