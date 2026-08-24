import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useYtPlayer } from "@/lib/verzzify/yt-player";
import type { YouTubeVideo } from "@/lib/verzzify/types";

export const Route = createFileRoute("/_app/watch/$id")({
  component: WatchPage,
});

function WatchPage() {
  const { id } = Route.useParams();
  const open = useYtPlayer((s) => s.open);
  const title = useYtPlayer((s) => s.title);
  const channel = useYtPlayer((s) => s.channel);
  const [status, setStatus] = useState("Opening…");

  useEffect(() => {
    const videoId = id.trim();
    if (!videoId) {
      setStatus("Missing video.");
      return;
    }
    open({
      videoId,
      title: "VerzZify",
      channel: "",
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    });
    void fetch(`/api/v1/youtube?q=${encodeURIComponent(videoId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { videos?: YouTubeVideo[] } | null) => {
        const v = json?.videos?.find((x) => x.videoId === videoId) ?? json?.videos?.[0];
        if (v && v.videoId === videoId) {
          useYtPlayer.setState({
            title: v.title,
            channel: v.channelName,
            thumbnailUrl: v.thumbnailUrl,
            watchUrl: v.url,
          });
        }
        setStatus("");
      })
      .catch(() => setStatus(""));
  }, [id, open]);

  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Shared on VerzZify</p>
      <h1 className="mt-3 font-display text-3xl">{title && title !== "VerzZify" ? title : "Now playing"}</h1>
      {channel ? <p className="mt-2 text-sm text-muted-foreground">{channel}</p> : null}
      {status ? (
        <p className="mt-6 text-sm text-muted-foreground">{status}</p>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Playing in the VerzZify player.</p>
      )}
    </div>
  );
}
