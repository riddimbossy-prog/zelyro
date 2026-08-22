import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { buyLiveAccess, getLivePage } from "@/lib/zelyro/queries";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/live/$id")({ component: LivePage });

function LivePage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["live", id], queryFn: () => getLivePage({ data: id }) });
  if (!q.data) return <div className="h-64 animate-pulse rounded-3xl bg-secondary" />;
  const { live, entitled } = q.data;
  return (
    <div>
      <img src={live.posterUrl} alt="" className="h-64 w-full rounded-[28px] object-cover md:h-80" />
      <p className="mt-6 text-xs tracking-widest text-sand uppercase">VerzZify Live · PPV</p>
      <h1 className="mt-2 font-display text-4xl">{live.title}</h1>
      <p className="text-muted-foreground">{live.artistName}</p>
      {entitled ? (
        <div className="mt-8 overflow-hidden rounded-3xl bg-card">
          <div className="grid aspect-video place-items-center bg-secondary">
            <p className="max-w-sm px-6 text-center text-sm text-muted-foreground">
              Access granted. In production this surface is a short-lived stream token into Agora / Daily.
              The door is server-side — never a public URL.
            </p>
          </div>
        </div>
      ) : (
        <Button
          className="mt-8"
          onClick={async () => {
            try {
              await buyLiveAccess({ data: id });
              toast("Access unlocked");
              void qc.invalidateQueries({ queryKey: ["live", id] });
            } catch {
              toast("Sign in to purchase access");
            }
          }}
        >
          Buy access {live.isFree ? "" : formatMoney(live.priceCents)}
        </Button>
      )}
    </div>
  );
}
