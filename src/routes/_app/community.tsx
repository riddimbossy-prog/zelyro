import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPost, getCommunity } from "@/lib/zelyro/queries";
import { getActivePromotions } from "@/lib/zelyro/promotions";
import { usePlayer } from "@/lib/zelyro/player";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useState } from "react";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { YouTubePromotionCard } from "@/components/youtube-promotion-card";

export const Route = createFileRoute("/_app/community")({ component: Community });

function Community() {
  const user = useCurrentUser();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["community"], queryFn: () => getCommunity() });
  const promoted = useQuery({ queryKey: ["promoted-home"], queryFn: () => getActivePromotions() });
  const [body, setBody] = useState("");
  const play = usePlayer((s) => s.play);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl">Community</h1>
      <p className="mt-2 text-sm text-muted-foreground">Releases, nights, and notes from the catalog.</p>
      {(promoted.data ?? []).length > 0 && (
        <section className="mt-6">
          <p className="text-xs tracking-widest text-sand uppercase">Sponsored</p>
          <h2 className="font-display text-lg">Promoted Music</h2>
          <div className="mt-3 space-y-3">
            {(promoted.data ?? []).slice(0, 3).map((p) => (
              <YouTubePromotionCard key={p.campaignId} promo={p} compact />
            ))}
          </div>
        </section>
      )}
      {user && (
        <form
          className="mt-6 rounded-3xl bg-card p-4"
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
      )}
      <ul className="mt-6 space-y-4">
        {(q.data ?? []).map((p) => (
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
            {p.imageUrl && (
              <img src={p.imageUrl} alt="" className="mt-3 max-h-80 w-full rounded-2xl object-cover" />
            )}
            {p.track && (
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
