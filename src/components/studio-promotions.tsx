import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  connectYoutubeChannel,
  createCatalogPromotion,
  createYoutubePromotion,
  getCampaignAnalytics,
  getMyCampaigns,
  pauseCampaign,
  validatePromotionLink,
} from "@/lib/verzzify/promotions";
import type { CampaignAnalytics, YouTubePromotion, YouTubeVideo } from "@/lib/verzzify/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/utils";
import { toast } from "sonner";
import { YouTubePromotionCard } from "@/components/youtube-promotion-card";
import { Link } from "@tanstack/react-router";

const GENRES = [
  "Hip Hop",
  "R&B",
  "Pop",
  "Latin",
  "Electronic",
  "City Pop",
  "Electropop",
  "Techno",
  "Indie",
  "Afrobeats",
  "Gospel",
  "Dancehall",
  "Amapiano",
  "Highlife",
  "Rock",
];
const COUNTRIES = [
  { id: "US", name: "United States" },
  { id: "GB", name: "United Kingdom" },
  { id: "JP", name: "Japan" },
  { id: "KR", name: "South Korea" },
  { id: "MX", name: "Mexico" },
  { id: "DE", name: "Germany" },
  { id: "IN", name: "India" },
  { id: "BR", name: "Brazil" },
  { id: "NG", name: "Nigeria" },
  { id: "GH", name: "Ghana" },
  { id: "FR", name: "France" },
  { id: "LB", name: "Lebanon" },
  { id: "ZA", name: "South Africa" },
  { id: "JM", name: "Jamaica" },
];

type Kind = "list" | "youtube" | "song" | "album" | "event" | "livestream" | "analytics";

export function StudioPromotions() {
  const qc = useQueryClient();
  const campaigns = useQuery({ queryKey: ["my-campaigns"], queryFn: () => getMyCampaigns() });
  const [kind, setKind] = useState<Kind>("list");
  const [focus, setFocus] = useState<YouTubePromotion | null>(null);

  if (kind === "youtube") {
    return (
      <YoutubeWizard
        onBack={() => setKind("list")}
        onDone={() => {
          void qc.invalidateQueries({ queryKey: ["my-campaigns"] });
          setKind("list");
        }}
      />
    );
  }
  if (kind === "song" || kind === "album" || kind === "event" || kind === "livestream") {
    return (
      <SimplePromote
        type={kind}
        onBack={() => setKind("list")}
        onDone={() => {
          void qc.invalidateQueries({ queryKey: ["my-campaigns"] });
          setKind("list");
        }}
      />
    );
  }
  if (kind === "analytics" && focus) {
    return (
      <AnalyticsPanel
        promo={focus}
        onBack={() => {
          setKind("list");
          setFocus(null);
        }}
      />
    );
  }

  const rows = campaigns.data ?? [];

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["youtube", "Promote a track"],
            ["song", "Promote Song"],
            ["album", "Promote Album"],
            ["event", "Promote Event"],
            ["livestream", "Promote Livestream"],
          ] as const
        ).map(([k, label]) => (
          <Button key={k} size="sm" variant={k === "youtube" ? "default" : "subtle"} onClick={() => setKind(k)}>
            {label}
          </Button>
        ))}
      </div>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Two lanes: upload to VerzZify, or paste a public watch URL and send listeners to it. Campaigns
        enter review before they go live.
      </p>
      <ConnectChannel />
      <ul className="mt-6 space-y-3">
        {rows.map((c) => (
          <li key={c.campaignId} className="rounded-3xl bg-card p-4">
            <div className="flex flex-wrap items-start gap-4">
              {c.video.thumbnailUrl && (
                <img src={c.video.thumbnailUrl} alt="" className="size-20 rounded-xl object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs tracking-widest text-sand uppercase">
                  {c.contentType} · {c.status.replaceAll("_", " ")}
                </p>
                <p className="mt-1 font-medium">{c.campaignName}</p>
                <p className="truncate text-xs text-muted-foreground">{c.video.title}</p>
                <p className="mt-2 text-xs tabular text-muted-foreground">
                  {c.impressions} impressions · {c.clicks} clicks · {formatMoney(c.spentCents)} spent
                  {c.budgetCents > 0 ? ` · ${formatMoney(Math.max(0, c.budgetCents - c.spentCents))} left` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.startDate ?? "—"} → {c.endDate ?? "—"}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={() => {
                    setFocus(c);
                    setKind("analytics");
                  }}
                >
                  Analytics
                </Button>
                {(c.status === "active" || c.status === "paused") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const r = await pauseCampaign({ data: c.campaignId });
                        toast(r.status);
                        void qc.invalidateQueries({ queryKey: ["my-campaigns"] });
                      } catch (e) {
                        toast(e instanceof Error ? e.message : "Could not update");
                      }
                    }}
                  >
                    {c.status === "paused" ? "Resume" : "Pause"}
                  </Button>
                )}
              </div>
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-3xl bg-card p-6 text-sm text-muted-foreground">
            No campaigns yet. Start with a public watch URL — VerzZify pulls the title and thumbnail.
          </li>
        )}
      </ul>
    </div>
  );
}

function ConnectChannel() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  return (
    <form
      className="mt-6 space-y-2 rounded-3xl bg-card p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await connectYoutubeChannel({
            data: { channelUrl: url, channelName: name, channelId: id },
          });
          toast("YouTube channel saved");
        } catch (err) {
          toast(err instanceof Error ? err.message : "Could not connect");
        }
      }}
    >
      <p className="text-sm font-medium">Connect a channel</p>
      <p className="text-xs text-muted-foreground">
        Optional. Stores the public channel id, URL, and display name so VerzZify can recognize your official presence.
      </p>
      <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/channel/…" required />
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Channel display name" required />
      <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="Channel ID" required />
      <Button type="submit" size="sm">
        Save channel
      </Button>
    </form>
  );
}

function YoutubeWizard({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [video, setVideo] = useState<YouTubeVideo | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("US");
  const [genre, setGenre] = useState("Hip Hop");
  const [audience, setAudience] = useState("fans");
  const [budget, setBudget] = useState("0");
  const [daily, setDaily] = useState("0");
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));

  async function validate() {
    setBusy(true);
    setWarn(null);
    try {
      const r = await validatePromotionLink({ data: url });
      if (!r.ok || !r.video) {
        toast(r.reason ?? "Could not validate");
        return;
      }
      setVideo(r.video);
      setName((n) => n || r.video!.title);
      setWarn(r.reason ?? null);
      setStep(3);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Validation failed");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!video) return;
    setBusy(true);
    try {
      await createYoutubePromotion({
        data: {
          url: video.url,
          campaignName: name,
          description,
          country,
          genre,
          audience,
          budgetCents: Math.round(Number(budget) * 100) || 0,
          dailyBudgetCents: Math.round(Number(daily) * 100) || 0,
          startDate: start,
          endDate: end,
        },
      });
      toast("Campaign submitted for review");
      onDone();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not publish");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 max-w-xl rounded-3xl bg-card p-6">
      <button type="button" className="text-xs text-muted-foreground" onClick={onBack}>
        ← Promotions
      </button>
      <p className="mt-3 text-xs tracking-[0.2em] text-sand uppercase">Step {step} of 5</p>
      <h2 className="mt-1 font-display text-2xl">Promote a track</h2>

      {step === 1 && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setStep(2);
            void validate();
          }}
        >
          <Label>Paste a public watch URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=… or https://youtu.be/…"
            required
          />
          <p className="text-xs text-muted-foreground">
            Title, thumbnail, and channel come from the source. Do not type them by hand.
          </p>
          <Button type="submit">Continue</Button>
        </form>
      )}

      {step === 2 && (
        <p className="mt-6 text-sm text-muted-foreground">{busy ? "Checking the link with YouTube…" : "Validating"}</p>
      )}

      {step === 3 && video && (
        <div className="mt-4 space-y-3">
          <img src={video.thumbnailUrl} alt="" className="aspect-video w-full rounded-2xl object-cover" />
          <p className="font-medium">{video.title}</p>
          <p className="text-sm text-muted-foreground">{video.channelName}</p>
          {warn && <p className="text-xs text-sand">{warn}</p>}
          <div className="flex gap-2">
            <Button onClick={() => setStep(4)}>Looks right</Button>
            <Button variant="outline" onClick={() => setStep(1)}>
              Different link
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setStep(5);
          }}
        >
          <Label>Campaign title</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
          <Label>Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          <Label>Target country</Label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm"
          >
            {COUNTRIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Label>Target genre</Label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm"
          >
            {GENRES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <Label>Audience</Label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm"
          >
            <option value="fans">Existing fans</option>
            <option value="new listeners">New listeners</option>
            <option value="playlist curators">Playlist curators</option>
            <option value="all">Everyone</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Budget (USD, optional)</Label>
              <Input type="number" min={0} step="1" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
            <div>
              <Label>Daily budget</Label>
              <Input type="number" min={0} step="1" value={daily} onChange={(e) => setDaily(e.target.value)} />
            </div>
            <div>
              <Label>Start</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label>End</Label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <Button type="submit">Review</Button>
        </form>
      )}

      {step === 5 && video && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {name} · {country} · {genre} · {start} to {end}. Status after publish: pending review.
          </p>
          <YouTubePromotionCard
            promo={{
              campaignId: "preview",
              campaignName: name,
              description,
              status: "pending_review",
              contentType: "youtube",
              genre,
              country,
              featured: false,
              budgetCents: 0,
              spentCents: 0,
              currency: "USD",
              startDate: start,
              endDate: end,
              impressions: 0,
              clicks: 0,
              video,
              verzzifyArtistId: "",
              verzzifyArtistName: "You",
              verzzifyArtistSlug: "profile",
              verzzifyArtistAvatar: null,
              linkId: "preview",
            }}
          />
          <div className="flex gap-2">
            <Button onClick={() => void publish()} disabled={busy}>
              Publish campaign
            </Button>
            <Button variant="outline" onClick={() => setStep(4)}>
              Edit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SimplePromote({
  type,
  onBack,
  onDone,
}: {
  type: "song" | "album" | "event" | "livestream";
  onBack: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contentId, setContentId] = useState("");
  return (
    <form
      className="mt-8 max-w-lg space-y-3 rounded-3xl bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await createCatalogPromotion({
            data: { contentType: type, contentId: contentId || `pending_${type}`, campaignName: name, description },
          });
          toast("Campaign submitted for review");
          onDone();
        } catch (err) {
          toast(err instanceof Error ? err.message : "Could not create");
        }
      }}
    >
      <button type="button" className="text-xs text-muted-foreground" onClick={onBack}>
        ← Promotions
      </button>
      <h2 className="font-display text-2xl">Promote {type}</h2>
      <Label>Campaign title</Label>
      <Input value={name} onChange={(e) => setName(e.target.value)} required />
      <Label>VerzZify {type} id</Label>
      <Input value={contentId} onChange={(e) => setContentId(e.target.value)} placeholder="From your catalog" />
      <Label>Description</Label>
      <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      <Button type="submit">Submit for review</Button>
    </form>
  );
}

function AnalyticsPanel({ promo, onBack }: { promo: YouTubePromotion; onBack: () => void }) {
  const [range, setRange] = useState<"today" | "7d" | "30d" | "lifetime">("lifetime");
  const q = useQuery({
    queryKey: ["camp-an", promo.campaignId, range],
    queryFn: () => getCampaignAnalytics({ data: { campaignId: promo.campaignId, range } }),
  });
  const a = q.data;
  return (
    <div className="mt-8">
      <button type="button" className="text-xs text-muted-foreground" onClick={onBack}>
        ← Promotions
      </button>
      <h2 className="mt-2 font-display text-2xl">{promo.campaignName}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["today", "7d", "30d", "lifetime"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`h-10 rounded-full px-4 text-sm ${range === r ? "bg-foreground text-background" : "bg-secondary"}`}
          >
            {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : r === "today" ? "Today" : "Campaign Lifetime"}
          </button>
        ))}
      </div>
      {a && <Metrics a={a} />}
      <p className="mt-6 max-w-xl text-xs text-muted-foreground">{a?.youtubeViewsNote}</p>
      <p className="mt-2 text-xs">
        Admin review lives in the <Link to="/admin" className="underline">promotions desk</Link>.
      </p>
    </div>
  );
}

function Metrics({ a }: { a: CampaignAnalytics }) {
  const cells: [string, string][] = [
    ["Impressions", String(a.impressions)],
    ["Unique impressions", String(a.uniqueImpressions)],
    ["Clicks", String(a.clicks)],
    ["Plays initiated (VerzZify)", String(a.playsInitiated)],
    ["Profile visits", String(a.profileVisits)],
    ["Shares", String(a.shares)],
    ["Saves", String(a.saves)],
    ["Followers gained", String(a.followersGained)],
    ["CTR", `${(a.ctr * 100).toFixed(1)}%`],
    ["Spent", formatMoney(a.spentCents)],
    ["Remaining budget", formatMoney(a.remainingCents)],
    [
      "YouTube views",
      a.youtubeViews == null ? "Not available" : String(a.youtubeViews),
    ],
  ];
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {cells.map(([k, v]) => (
        <div key={k} className="rounded-3xl bg-card p-4">
          <p className="text-xs text-muted-foreground">{k}</p>
          <p className="mt-1 font-display text-xl tabular">{v}</p>
        </div>
      ))}
    </div>
  );
}
