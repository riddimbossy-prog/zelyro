import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getLibrary } from "@/lib/verzzify/queries";
import { TrackRow } from "@/components/track-row";
import { ArtistTile } from "@/components/cover-card";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DownloadsFolder } from "@/components/downloads-folder";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/library")({ component: Library });

function Library() {
  const { user, isPending } = useCurrentUserState();
  const q = useQuery({ queryKey: ["library"], queryFn: () => getLibrary(), enabled: Boolean(user) });
  const [tab, setTab] = useState<"downloads" | "liked" | "purchased" | "history" | "tickets">("downloads");
  if (isPending) return <div className="h-40 animate-pulse rounded-3xl bg-secondary" />;

  const d = q.data;
  const tabs = [
    ["downloads", "Downloads"],
    ["liked", "Liked"],
    ["purchased", "Purchased"],
    ["history", "Recently played"],
    ["tickets", "Tickets"],
  ] as const;

  return (
    <div>
      <h1 className="font-display text-3xl">Library</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Offline downloads and playlists stay on this device and keep playing when you leave the page.
      </p>
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "h-10 shrink-0 rounded-full px-4 text-sm",
              tab === id ? "bg-foreground text-background" : "bg-secondary",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "downloads" && <DownloadsFolder />}
        {tab !== "tickets" && tab !== "downloads" && !user && (
          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline">
              Sign in
            </Link>{" "}
            to sync liked songs and purchases. Downloads work offline without an account.
          </p>
        )}
        {tab !== "tickets" &&
          tab !== "downloads" &&
          user &&
          (d?.[tab] ?? []).map((t, i) => (
            <TrackRow key={t.id} track={t} queue={d?.[tab] ?? []} index={i} />
          ))}
        {tab === "tickets" &&
          (user ? (
            d?.tickets.length ? (
              d.tickets.map((t) => (
                <div key={t.id} className="mb-3 flex gap-3 rounded-2xl bg-card p-3">
                  <img src={t.posterUrl} alt="" className="size-16 rounded-lg object-cover" />
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.typeName} · {t.code} · {t.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No tickets yet.</p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              <Link to="/login" className="text-primary underline">
                Sign in
              </Link>{" "}
              to see tickets.
            </p>
          ))}
        {tab !== "tickets" && tab !== "downloads" && user && d && d[tab].length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing here yet. Play something you love.</p>
        )}
      </div>
      {d && d.following.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 font-display text-xl">Following</h2>
          <div className="media-rail">
            {d.following.map((a) => (
              <ArtistTile
                key={a.id}
                id={a.id}
                slug={a.slug}
                name={a.name}
                avatarUrl={a.avatarUrl}
                verified={a.verified}
                followed
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
