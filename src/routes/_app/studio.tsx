import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getHomeData, getStudioOverview, getWallet, requestPayout, scanTicket } from "@/lib/verzzify/queries";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import { CreatorStudio, StudioSearchHint } from "@/components/creator-studio";
import { TrackRow } from "@/components/track-row";

export const Route = createFileRoute("/_app/studio")({
  loader: () => getHomeData(),
  component: Studio,
});

function Studio() {
  const { user, isPending } = useCurrentUserState();
  const home = Route.useLoaderData();
  const studio = useQuery({ queryKey: ["studio"], queryFn: () => getStudioOverview(), enabled: Boolean(user) });
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: () => getWallet(), enabled: Boolean(user) });
  if (isPending) return <div className="h-40 animate-pulse rounded-3xl bg-secondary" />;
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="mx-auto max-w-2xl">
      <StudioSearchHint />
      <CreatorStudio newest={home?.newest ?? studio.data?.tracks ?? []} compact />
      {studio.data?.artist && (
        <section className="mt-10">
          <h2 className="font-display text-xl">Your catalog</h2>
          <p className="text-xs text-muted-foreground">VerzZify-hosted files. YouTube lives in Youtube Link.</p>
          {(studio.data.tracks ?? []).map((t, i) => (
            <TrackRow key={t.id} track={t} queue={studio.data?.tracks ?? []} index={i} showArtist={false} />
          ))}
        </section>
      )}
      {wallet.data && (
        <section className="mt-10">
          <h2 className="font-display text-xl">Wallet</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Stat label="Available" value={formatMoney(wallet.data.snapshot.availableCents)} />
            <Stat label="Pending" value={formatMoney(wallet.data.snapshot.pendingCents)} />
            <Stat label="Lifetime" value={formatMoney(wallet.data.snapshot.lifetimeCents)} />
          </div>
          <Button
            className="mt-4"
            onClick={async () => {
              try {
                await requestPayout({
                  data: {
                    amountCents: Math.min(wallet.data.snapshot.availableCents, 5000),
                    method: "momo",
                    destination: "MTN",
                  },
                });
                toast("Payout requested");
                void wallet.refetch();
              } catch (e) {
                toast(e instanceof Error ? e.message : "Payout failed");
              }
            }}
          >
            Request payout
          </Button>
        </section>
      )}
      <ScanPanel />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg tabular">{value}</p>
    </div>
  );
}

function ScanPanel() {
  const [code, setCode] = useState("");
  return (
    <form
      className="mt-10 space-y-3 rounded-3xl bg-card p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const r = await scanTicket({ data: code });
          toast(r.result.replaceAll("_", " "));
        } catch {
          toast("Sign in as staff to scan");
        }
      }}
    >
      <h2 className="font-display text-xl">Door scanner</h2>
      <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ticket code" />
      <Button type="submit">Validate</Button>
    </form>
  );
}
