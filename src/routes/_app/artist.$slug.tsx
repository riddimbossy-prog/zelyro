import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getArtistPage, toggleFollow, purchaseTrack } from "@/lib/sheba/queries";
import { usePlayer } from "@/lib/sheba/player";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCount, formatMoney } from "@/lib/utils";
import { toast } from "sonner";
import { Play, BadgeCheck } from "lucide-react";
import { useYtPlayer } from "@/lib/sheba/yt-player";

export const Route = createFileRoute("/_app/artist/$slug")({
  loader: ({ params }) => getArtistPage({ data: params.slug }),
  component: ArtistPage,
});

function ArtistPage() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const initial = Route.useLoaderData();
  const q = useQuery({
    queryKey: ["artist", slug],
    queryFn: () => getArtistPage({ data: slug }),
    initialData: initial ?? undefined,
  });
  const play = usePlayer((s) => s.play);
  const openYt = useYtPlayer((s) => s.open);
  if (q.isPending) return <div className="h-80 animate-pulse rounded-3xl bg-secondary" />;
  if (!q.data) return <p className="py-16">Artist not found.</p>;
  const { artist, tracks, albums, following, videoCall, youtube } = q.data;

  const groups = [
    { key: "music_video", label: "Music videos" },
    { key: "performance", label: "Performances" },
    { key: "interview", label: "Interviews" },
    { key: "latest", label: "Latest" },
    { key: "other", label: "More" },
  ];

  return (
    <div>
      <div className="relative overflow-hidden rounded-[28px]">
        <img src={artist.bannerUrl ?? "/banners/accra.jpg"} alt="" className="h-48 w-full object-cover md:h-64" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-end gap-4">
          <img src={artist.avatarUrl ?? "/favicon.svg"} alt="" className="size-24 rounded-full object-cover md:size-28" />
          <div>
            <p className="flex items-center gap-2 font-display text-3xl">
              {artist.name}
              {artist.verified && <BadgeCheck className="size-6 text-sand" />}
            </p>
            <p className="text-sm text-muted-foreground">
              {artist.city}, {artist.country} · {formatCount(artist.monthlyListeners)} monthly listeners
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => play(tracks, 0)}>
          <Play className="size-4 fill-current" /> Play
        </Button>
        <Button
          variant={following ? "subtle" : "outline"}
          onClick={async () => {
            try {
              await toggleFollow({ data: artist.id });
              void qc.invalidateQueries({ queryKey: ["artist", slug] });
            } catch {
              toast("Sign in to follow");
            }
          }}
        >
          {following ? "Following" : "Follow"}
        </Button>
        <Badge>{artist.genres}</Badge>
      </div>
      {artist.bio && <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">{artist.bio}</p>}
      <h2 className="mt-10 font-display text-2xl">Top songs</h2>
      <p className="text-xs text-muted-foreground">Sheba-hosted</p>
      <div className="mt-3">
        {tracks.map((t, i) => (
          <TrackRow key={t.id} track={t} queue={tracks} index={i} showArtist={false} />
        ))}
      </div>
      {albums.length > 0 && (
        <div className="mt-10 sheba-rail">
          {albums.map((a) => (
            <a key={a.id} href={`/album/${a.id}`} className="min-w-0">
              <img src={a.coverUrl} alt="" className="aspect-square w-full rounded-2xl object-cover" />
              <p className="mt-2 truncate text-sm">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.albumType}</p>
            </a>
          ))}
        </div>
      )}

      {youtube && (youtube.connection || youtube.videos.length > 0) && (
        <section className="mt-12">
          <p className="text-xs tracking-[0.2em] text-sand uppercase">YouTube</p>
          <h2 className="mt-1 font-display text-2xl">YouTube</h2>
          {youtube.connection && (
            <p className="mt-2 text-sm text-muted-foreground">
              Connected channel: {youtube.connection.channelName}
              {youtube.connection.subscriberCount
                ? ` · ${formatCount(youtube.connection.subscriberCount)} subscribers (public)`
                : ""}
              {" · "}
              <a href={youtube.connection.channelUrl} target="_blank" rel="noreferrer" className="underline">
                Open channel
              </a>
            </p>
          )}
          {youtube.videos.some((v) => v.promoted) && (
            <div className="mt-6">
              <h3 className="font-display text-lg">Promoted videos</h3>
              <div className="sheba-rail sheba-rail-wide mt-3">
                {youtube.videos
                  .filter((v) => v.promoted)
                  .map((v) => (
                    <YtThumb key={v.id} title={v.video.title} channel={v.video.channelName} thumb={v.video.thumbnailUrl} onPlay={() => openYt({ videoId: v.video.videoId, title: v.video.title, channel: v.video.channelName, watchUrl: v.video.url })} />
                  ))}
              </div>
            </div>
          )}
          {groups.map((g) => {
            const items = youtube.videos.filter((v) => v.category === g.key);
            if (!items.length) return null;
            return (
              <div key={g.key} className="mt-6">
                <h3 className="font-display text-lg">{g.label}</h3>
                <div className="sheba-rail sheba-rail-wide mt-3">
                  {items.map((v) => (
                    <YtThumb
                      key={v.id}
                      title={v.video.title}
                      channel={v.video.channelName}
                      thumb={v.video.thumbnailUrl}
                      onPlay={() =>
                        openYt({
                          videoId: v.video.videoId,
                          title: v.video.title,
                          channel: v.video.channelName,
                          watchUrl: v.video.url,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {videoCall?.available && (
        <section className="mt-10 rounded-3xl bg-card p-6">
          <p className="text-xs tracking-widest text-sand uppercase">Fan session</p>
          <h3 className="mt-2 font-display text-xl">Paid 1:1 video</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {videoCall.durationMin} minutes · {formatMoney(videoCall.priceCents)}
          </p>
          <Button className="mt-4" onClick={() => toast("Booking calendar ships with the video-call provider adapter.")}>
            Request a slot
          </Button>
        </section>
      )}
      {tracks.some((t) => t.priceCents > 0) && (
        <p className="mt-8 text-xs text-muted-foreground">
          Buying a song never transfers copyright.{" "}
          <button
            type="button"
            className="underline"
            onClick={async () => {
              const paid = tracks.find((t) => t.priceCents > 0);
              if (!paid) return;
              try {
                const r = await purchaseTrack({ data: { trackId: paid.id, license: "basic" } });
                toast(r.rights ?? "Added to library");
              } catch {
                toast("Sign in to purchase");
              }
            }}
          >
            Support {artist.name}
          </button>
        </p>
      )}
    </div>
  );
}

function YtThumb({
  title,
  channel,
  thumb,
  onPlay,
}: {
  title: string;
  channel: string;
  thumb: string;
  onPlay: () => void;
}) {
  return (
    <article className="min-w-0">
      <button type="button" onClick={onPlay} className="relative block w-full overflow-hidden rounded-2xl">
        <img src={thumb} alt="" className="aspect-video w-full object-cover" />
        <span className="absolute right-2 bottom-2 grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
          <Play className="size-3.5 translate-x-px fill-current" />
        </span>
      </button>
      <p className="mt-2 truncate text-sm">{title}</p>
      <p className="truncate text-xs text-muted-foreground">{channel} · YouTube</p>
    </article>
  );
}
