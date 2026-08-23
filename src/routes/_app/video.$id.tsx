import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getVideoSession } from "@/lib/verzzify/video-actions";
import { VideoCallRoom } from "@/components/video-call-room";

export const Route = createFileRoute("/_app/video/$id")({
  loader: ({ params }) => getVideoSession({ data: params.id }),
  component: VideoPage,
});

function VideoPage() {
  const { id } = Route.useParams();
  const initial = Route.useLoaderData();
  const q = useQuery({
    queryKey: ["video", id],
    queryFn: () => getVideoSession({ data: id }),
    initialData: initial ?? undefined,
  });
  const session = q.data ?? initial;
  if (session === null) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-2xl">This room closed</p>
        <p className="mt-2 text-sm text-muted-foreground">Ask the artist to open a new 1-1 from Studio.</p>
      </div>
    );
  }
  if (!session) return <div className="min-h-dvh animate-pulse bg-secondary" />;
  return <VideoCallRoom session={session} />;
}
