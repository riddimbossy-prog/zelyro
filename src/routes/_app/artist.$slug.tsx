import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getArtistPage, purchaseTrack } from "@/lib/verzzify/queries";
import { bookVideoCall } from "@/lib/verzzify/video-actions";
import { Button } from "@/components/ui/button";
import { formatCount, formatMoney } from "@/lib/utils";
import { toast } from "sonner";
import { Play } from "@/components/icons";
import { useYtPlayer } from "@/lib/verzzify/yt-player";
import { MackProfileView } from "@/components/mack-profile";

export const Route = createFileRoute("/_app/artist/$slug")({
  loader: ({ params }) => getArtistPage({ data: params.slug }),
  component: ArtistPage,
});

function ArtistPage() {
  const { slug } = Route.useParams();
  const initial = Route.useLoaderData();
  const q = useQuery({
    queryKey: ["artist", slug],
    queryFn: () => getArtistPage({ data: slug }),
    initialData: initial ?? undefined,
  });
  const openYt = useYtPlayer((s) => s.open);
  const navigate = useNavigate();
  if (q.isPending) return <div className="h-80 animate-pulse rounded-3xl bg-secondary" />;
  if (!q.data) return <p className="py-16">Artist not found.</p>;
  const { artist, tracks, albums, following, videoCall, youtube, live, chartRanks } = q.data;
  const totalPlays = tracks.reduce((n, t) => n + t.playCount, 0);

  const groups = [
    { key: "music_video", label: "Music videos" },
    { key: "performance", label: "Performances" },
    { key: "interview", label: "Interviews" },
    { key: "latest", label: "Latest" },
    { key: "other", label: "More" },
  ];

  return (
    <div>
      <MackProfileView
        name={artist.name}
        slug={artist.slug}
        avatarUrl={artist.avatarUrl}
        bannerUrl={artist.bannerUrl}
        bio={artist.bio}
        city={artist.city}
        country={artist.country}
        verified={artist.verified}
        totalPlays={totalPlays}
        followers={artist.followers}
        followingCount={0}
        genres={artist.genres}
        monthlyListeners={artist.monthlyListeners}
        tracks={tracks}
        albums={albums}
        live={live}
        chartRanks={chartRanks}
        videoCall={videoCall}
        isFollowing={following}
        artistId={artist.id}
        onBookCall={async () => {
          try {
            const r = await bookVideoCall({ data: { artistId: artist.id } });
            void navigate({ to: "/video/$id", params: { id: r.id } });
          } catch (e) {
            toast(e instanceof Error ? e.message : "Could not book a slot");
          }
        }}
      />

      {youtube && (youtube.connection || youtube.videos.length > 0) && (
        <section className="mt-12">
          <p className="text-xs tracking-[0.2em] text-sand uppercase">Videos</p>
          <h2 className="mt-1 font-display text-2xl">Watch</h2>
          {youtube.connection && (
            <p className="mt-2 text-sm text-muted-foreground">
              Connected: {youtube.connection.channelName}
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
              <div className="media-rail media-rail-wide mt-3">
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
                <div className="media-rail media-rail-wide mt-3">
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
          <h3 className="mt-2 font-display text-xl">1-1 Video Chat</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {videoCall.durationMin} minutes · {formatMoney(videoCall.priceCents)}
          </p>
          <Button
            className="mt-4"
            onClick={async () => {
              try {
                const r = await bookVideoCall({ data: { artistId: artist.id } });
                void navigate({ to: "/video/$id", params: { id: r.id } });
              } catch (e) {
                toast(e instanceof Error ? e.message : "Sign in to book a slot");
              }
            }}
          >
            Join 1-1
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
      <p className="truncate text-xs text-muted-foreground">{channel} · VerzZify</p>
    </article>
  );
}
