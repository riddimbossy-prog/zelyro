import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { becomeArtist, getStudioOverview, getWallet, publishTrack, requestPayout, scanTicket } from "@/lib/zelyro/queries";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/utils";
import { TrackRow } from "@/components/track-row";
import { StudioPromotions } from "@/components/studio-promotions";
import { toast } from "sonner";
import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export const Route = createFileRoute("/_app/studio")({ component: Studio });

const TABS = ["overview", "upload", "promotions", "wallet", "scan"] as const;

function Studio() {
  const { user, isPending } = useCurrentUserState();
  const studio = useQuery({ queryKey: ["studio"], queryFn: () => getStudioOverview(), enabled: Boolean(user) });
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: () => getWallet(), enabled: Boolean(user) });
  const [tab, setTab] = useState<(typeof TABS)[number]>("overview");
  if (isPending) return <div className="h-40 animate-pulse rounded-3xl bg-secondary" />;
  if (!user) return <RedirectToSignIn />;

  const artist = studio.data?.artist;
  const chart = [
    { d: "Mon", v: 12 },
    { d: "Tue", v: 18 },
    { d: "Wed", v: 9 },
    { d: "Thu", v: 22 },
    { d: "Fri", v: 31 },
    { d: "Sat", v: 44 },
    { d: "Sun", v: 28 },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Creator Studio</h1>
          <p className="text-sm text-muted-foreground">Catalog, YouTube promotions, earnings, and the door.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`h-10 rounded-full px-4 text-sm capitalize ${tab === t ? "bg-foreground text-background" : "bg-secondary"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {!artist && tab === "overview" && <BecomeArtist onDone={() => void studio.refetch()} />}

      {tab === "overview" && artist && (
        <div className="mt-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Verification" value={artist.verification_status} />
            <Stat label="Monthly listeners" value={String(artist.monthly_listeners)} />
            <Stat label="Meaningful streams" value={String(studio.data?.meaningfulStreams ?? 0)} />
          </div>
          <div className="mt-6 h-48 rounded-3xl bg-card p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <XAxis dataKey="d" stroke="currentColor" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="v" stroke="var(--accent)" fill="color-mix(in oklab, var(--accent) 30%, transparent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <h2 className="mt-8 font-display text-xl">Your catalog</h2>
          <p className="text-xs text-muted-foreground">Zelyro-hosted files. YouTube promotions live in Promotions.</p>
          {(studio.data?.tracks ?? []).map((t, i) => (
            <TrackRow key={t.id} track={t} queue={studio.data?.tracks ?? []} index={i} showArtist={false} />
          ))}
        </div>
      )}

      {tab === "upload" && <UploadForm onDone={() => void studio.refetch()} />}
      {tab === "promotions" && <StudioPromotions />}
      {tab === "wallet" && wallet.data && (
        <WalletPanel
          available={wallet.data.snapshot.availableCents}
          pending={wallet.data.snapshot.pendingCents}
          lifetime={wallet.data.snapshot.lifetimeCents}
          ledger={wallet.data.ledger}
          onPayout={() => void wallet.refetch()}
        />
      )}
      {tab === "scan" && <ScanPanel />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl capitalize tabular">{value}</p>
    </div>
  );
}

function BecomeArtist({ onDone }: { onDone: () => void }) {
  const [artistName, setArtistName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("US");
  const [genres, setGenres] = useState("Hip Hop");
  return (
    <form
      className="mt-8 max-w-lg space-y-3 rounded-3xl bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await becomeArtist({ data: { artistName, bio, country, genres } });
          toast("Application in. Verification is pending.");
          onDone();
        } catch {
          toast("Could not start artist profile");
        }
      }}
    >
      <h2 className="font-display text-2xl">Become an artist</h2>
      <p className="text-sm text-muted-foreground">
        Register as an Artist/Creator. Payouts stay server-side.
      </p>
      <Label>Artist name</Label>
      <Input value={artistName} onChange={(e) => setArtistName(e.target.value)} required />
      <Label>Biography</Label>
      <Input value={bio} onChange={(e) => setBio(e.target.value)} required />
      <Label>Country</Label>
      <Input value={country} onChange={(e) => setCountry(e.target.value)} />
      <Label>Genres</Label>
      <Input value={genres} onChange={(e) => setGenres(e.target.value)} />
      <Button type="submit">Start creator account</Button>
    </form>
  );
}

function UploadForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Hip Hop");
  const [distribution, setDistribution] = useState("free_stream");
  const [price, setPrice] = useState("0");
  return (
    <form
      className="mt-8 max-w-lg space-y-3 rounded-3xl bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const r = await publishTrack({
            data: {
              title,
              genre,
              distribution,
              priceCents: Math.round(Number(price) * 100),
              coverUrl: "/covers/desk-light.jpg",
              audioUrl: "/audio/t11.mp3",
            },
          });
          toast(`Published ${r.id}`);
          onDone();
        } catch (err) {
          toast(err instanceof Error ? err.message : "Upload failed");
        }
      }}
    >
      <h2 className="font-display text-2xl">Upload wizard</h2>
      <p className="text-sm text-muted-foreground">
        Zelyro-hosted: stream, free download, paid download. YouTube links belong in Promotions.
      </p>
      <Label>Title</Label>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Label>Genre</Label>
      <Input value={genre} onChange={(e) => setGenre(e.target.value)} />
      <Label>Distribution</Label>
      <select
        value={distribution}
        onChange={(e) => setDistribution(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm"
      >
        <option value="free_stream">Free stream</option>
        <option value="free_download">Free download</option>
        <option value="paid_download">Paid download</option>
        <option value="premium">Premium download</option>
        <option value="subscriber_only">Subscriber only</option>
      </select>
      <Label>Price (USD)</Label>
      <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
      <Button type="submit">Publish</Button>
    </form>
  );
}

function WalletPanel({
  available,
  pending,
  lifetime,
  ledger,
  onPayout,
}: {
  available: number;
  pending: number;
  lifetime: number;
  ledger: { id: string; amountCents: number; direction: string; kind: string; createdAt: string }[];
  onPayout: () => void;
}) {
  return (
    <div className="mt-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Available" value={formatMoney(available)} />
        <Stat label="Pending" value={formatMoney(pending)} />
        <Stat label="Lifetime" value={formatMoney(lifetime)} />
      </div>
      <Button
        className="mt-6"
        onClick={async () => {
          try {
            await requestPayout({
              data: { amountCents: Math.min(available, 5000), method: "momo", destination: "MTN" },
            });
            toast("Payout requested");
            onPayout();
          } catch (e) {
            toast(e instanceof Error ? e.message : "Payout failed");
          }
        }}
      >
        Request payout
      </Button>
      <ul className="mt-6 divide-y divide-border rounded-3xl bg-card">
        {ledger.map((l) => (
          <li key={l.id} className="flex justify-between px-4 py-3 text-sm">
            <span className="capitalize">
              {l.kind} · {l.direction}
            </span>
            <span className="tabular">{formatMoney(l.amountCents)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScanPanel() {
  const [code, setCode] = useState("");
  return (
    <form
      className="mt-8 max-w-md space-y-3 rounded-3xl bg-card p-6"
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
      <h2 className="font-display text-2xl">Door scanner</h2>
      <p className="text-sm text-muted-foreground">QR payload is a random ticket code, never a payment id.</p>
      <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SHB-…" />
      <Button type="submit">Validate</Button>
      <p className="text-xs text-muted-foreground">
        Need a ticket first? Buy one on an <Link to="/discover" className="underline">event page</Link>.
      </p>
    </form>
  );
}
