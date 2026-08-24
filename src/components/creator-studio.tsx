import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Disc3,
  ImagePlus,
  Link2,
  ListMusic,
  MessageCircle,
  Radio,
  Ticket,
  Upload,
  Video,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatMoney } from "@/lib/utils";
import { toast } from "sonner";
import { becomeArtist, publishTrack } from "@/lib/verzzify/queries";
import {
  createAlbum,
  createLiveStream,
  createTicketEvent,
  createUserPlaylist,
  getCreatorStatus,
  listVideoChatHistory,
  setCreatorAvailable,
  upsertVideoCall,
} from "@/lib/verzzify/studio-actions";
import { StudioPromotions } from "@/components/studio-promotions";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { CoverCard } from "@/components/cover-card";
import type { TrackCard } from "@/lib/verzzify/types";
import { uploadStudioAsset } from "@/lib/storage/browser";
import { getInfraStatus } from "@/lib/infra/status";

type Panel =
  | "hub"
  | "upload"
  | "youtube"
  | "live"
  | "ticket"
  | "album"
  | "playlist"
  | "chat"
  | "history";

const TILES: { id: Panel; label: string; icon: typeof Upload }[] = [
  { id: "upload", label: "Upload Songs", icon: Upload },
  { id: "youtube", label: "Promote a track", icon: Link2 },
  { id: "live", label: "Live Stream", icon: Radio },
  { id: "ticket", label: "Create Ticket", icon: Ticket },
  { id: "album", label: "Create Album", icon: Disc3 },
  { id: "playlist", label: "Create Playlist", icon: ListMusic },
  { id: "chat", label: "1-1 Video Chat", icon: Video },
  { id: "history", label: "Video Chat History", icon: MessageCircle },
];

const MOODS = ["Relaxing", "Energetic", "Happy", "Dark", "Romantic", "Focus"];
const GENRES = ["Pop", "Hip Hop", "Latin", "Electronic", "R&B", "City Pop", "Afrobeats", "Indie", "Techno", "Rock"];
const LANGS = [
  "English (en)",
  "Spanish (es)",
  "Korean (ko)",
  "Japanese (ja)",
  "Hindi (hi)",
  "Arabic (ar)",
  "Portuguese (pt)",
  "French (fr)",
  "German (de)",
  "Twi (tw)",
];
const CATEGORIES = ["Concert", "Club night", "Festival", "Livestream", "Private"];
const COUNTRIES = ["US", "GB", "KR", "JP", "MX", "DE", "NG", "GH", "IN", "ZA", "BR", "FR"];

function previewUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function StudioSearchHint() {
  return (
    <Link
      to="/search"
      className="mb-5 flex h-12 items-center rounded-full bg-card px-4 text-sm text-muted-foreground"
    >
      Search
    </Link>
  );
}

export function CreatorStudio({
  newest = [],
  compact = false,
}: {
  newest?: TrackCard[];
  compact?: boolean;
}) {
  const user = useCurrentUser();
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ["creator-status"],
    queryFn: () => getCreatorStatus(),
    enabled: Boolean(user),
  });
  const infra = useQuery({
    queryKey: ["infra-status"],
    queryFn: () => getInfraStatus(),
  });
  const [panel, setPanel] = useState<Panel>("hub");
  const [filter, setFilter] = useState("All");
  const available = Boolean(status.data?.available);
  const isArtist = Boolean(status.data?.isArtist);

  function open(id: Panel) {
    if (!user) {
      toast("Sign in to use Creator Studio");
      return;
    }
    if (!isArtist && id !== "hub") {
      setPanel("hub");
      toast("Register as an artist first — the form is below.");
      return;
    }
    setPanel(id);
  }

  const filtered =
    filter === "All"
      ? newest
      : newest.filter(
          (t) =>
            (t.genre ?? "").toLowerCase().includes(filter.toLowerCase()) ||
            filter === "Songs" ||
            filter === "Beats",
        );

  return (
    <section>
      {panel !== "hub" && (
        <button
          type="button"
          className="mb-4 inline-flex h-11 items-center gap-2 text-sm text-muted-foreground"
          onClick={() => setPanel("hub")}
        >
          <ArrowLeft className="size-4" /> Back to studio
        </button>
      )}

      {panel === "hub" && (
        <>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.2em] text-sand uppercase">Creators</p>
              <h2 className="font-display text-2xl md:text-3xl">Your Creator Studio</h2>
              {infra.data && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Uploads →{" "}
                  {infra.data.s3.mode === "aws"
                    ? `AWS S3 · ${infra.data.s3.buckets.masters}`
                    : "object store (preview)"}
                  {" · "}
                  {infra.data.postgres.mode === "postgres" ? "Supabase Postgres" : "Postgres (preview)"}
                </p>
              )}
            </div>
            {user && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await setCreatorAvailable({ data: { available: !available } });
                    void qc.invalidateQueries({ queryKey: ["creator-status"] });
                  } catch {
                    toast("Could not update status");
                  }
                }}
                className="flex items-center gap-2 rounded-full bg-secondary py-1 pr-1 pl-3 text-xs"
              >
                Your available status
                <span
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium",
                    available ? "bg-primary text-primary-foreground" : "bg-foreground text-background",
                  )}
                >
                  {available ? "Online" : "Offline"}
                </span>
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {TILES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => open(t.id)}
                  className="flex min-h-24 flex-col items-start justify-center gap-2 rounded-2xl bg-card px-4 py-4 text-left transition-colors hover:bg-secondary"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-secondary">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>

          {user && !isArtist && (
            <BecomeArtistForm onDone={() => void qc.invalidateQueries({ queryKey: ["creator-status"] })} />
          )}

          {!compact && newest.length > 0 && (
            <div className="mt-8">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {["All", "Songs", "Pop", "Latin", "Hip Hop", "Electronic"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFilter(c)}
                    className={cn(
                      "h-9 shrink-0 rounded-full px-4 text-sm",
                      filter === c ? "bg-foreground text-background" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-end justify-between">
                <h3 className="font-display text-xl">New Releases</h3>
                <Link to="/discover" className="text-sm text-primary">
                  See All
                </Link>
              </div>
              <div className="media-rail mt-3">
                {filtered.slice(0, 8).map((t) => (
                  <CoverCard key={t.id} track={t} queue={filtered} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {panel === "upload" && <UploadSong onDone={() => setPanel("hub")} />}
      {panel === "youtube" && <StudioPromotions />}
      {panel === "live" && <LiveForm onDone={() => setPanel("hub")} />}
      {panel === "ticket" && <TicketForm onDone={() => setPanel("hub")} />}
      {panel === "album" && <AlbumForm onDone={() => setPanel("hub")} />}
      {panel === "playlist" && <PlaylistForm onDone={() => setPanel("hub")} />}
      {panel === "chat" && <VideoChatForm />}
      {panel === "history" && <VideoHistory />}
    </section>
  );
}

function BecomeArtistForm({ onDone }: { onDone: () => void }) {
  const [artistName, setArtistName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("US");
  const [genres, setGenres] = useState("Pop");
  return (
    <form
      className="mt-8 space-y-3 rounded-3xl bg-card p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await becomeArtist({
            data: { artistName: artistName.trim(), bio: bio.trim(), country, genres },
          });
          toast("Creator account is live");
          onDone();
        } catch (err) {
          toast(err instanceof Error ? err.message : "Could not register");
        }
      }}
    >
      <h3 className="font-display text-xl">Become an artist</h3>
      <p className="text-sm text-muted-foreground">Unlock uploads, tickets, live, and video chat.</p>
      <Input value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="Artist name" required />
      <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio" required />
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm"
      >
        {COUNTRIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <select
        value={genres}
        onChange={(e) => setGenres(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm"
      >
        {GENRES.map((g) => (
          <option key={g}>{g}</option>
        ))}
      </select>
      <Button type="submit">Start creator account</Button>
    </form>
  );
}

function Drop({
  label,
  hint,
  accept,
  preview,
  onFile,
}: {
  label: string;
  hint: string;
  accept: string;
  preview?: string | null;
  onFile: (f: File) => void;
}) {
  return (
    <label className="relative flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-primary/50 bg-secondary text-center">
      {preview ? (
        accept.startsWith("image") ? (
          <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <p className="text-sm">{hint}</p>
        )
      ) : (
        <>
          <ImagePlus className="size-8 text-muted-foreground" />
          <span className="text-sm">{label}</span>
        </>
      )}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </label>
  );
}

function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "h-9 shrink-0 rounded-full px-4 text-sm",
              value === o ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function UploadSong({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("Energetic");
  const [genre, setGenre] = useState("Hip Hop");
  const [language, setLanguage] = useState(LANGS[0]);
  const [paid, setPaid] = useState(false);
  const [price, setPrice] = useState("0.99");
  const [cover, setCover] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  return (
    <form
      className="mx-auto max-w-lg space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        if (!audio) {
          toast("Select an audio file");
          return;
        }
        setBusy(true);
        try {
          let coverUrl = "/covers/desk-light.jpg";
          if (cover) {
            setProgress("Uploading cover to the public bucket…");
            const up = await uploadStudioAsset(cover, "cover", (n) => setProgress(`Cover ${n}%`));
            coverUrl = up.url;
          }
          setProgress("Uploading master to the private bucket…");
          const master = await uploadStudioAsset(audio, "master", (n) => setProgress(`Master ${n}%`));
          setProgress("Publishing…");
          await publishTrack({
            data: {
              title: title.trim(),
              genre,
              mood,
              language,
              distribution: paid ? "paid_download" : "free_stream",
              priceCents: paid ? Math.round(Number(price) * 100) : 0,
              coverUrl,
              audioUrl: master.url,
            },
          });
          toast("Song submitted");
          onDone();
        } catch (err) {
          toast(err instanceof Error ? err.message : "Upload failed");
        } finally {
          setBusy(false);
          setProgress("");
        }
      }}
    >
      <h2 className="font-display text-2xl">Upload Song</h2>
      <p className="text-sm text-muted-foreground">
        Cover art lands in the public bucket. The master is private. A stream copy is minted for the
        player. Keep the file on VerzZify.
      </p>
      <Drop
        label="Upload Cover Art"
        hint="Cover selected"
        accept="image/*"
        preview={coverPreview}
        onFile={(f) => {
          setCover(f);
          setCoverPreview(previewUrl(f));
        }}
      />
      <Drop
        label="Select Audio"
        hint={audio ? audio.name : "MP3, WAV, M4A, FLAC"}
        accept="audio/*"
        preview={audio ? "audio" : null}
        onFile={(f) => setAudio(f)}
      />
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter Song Title" required />
      <ChipRow label="Select Mood" options={MOODS} value={mood} onChange={setMood} />
      <ChipRow label="Select Genre" options={GENRES} value={genre} onChange={setGenre} />
      <div>
        <Label>Language</Label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="mt-1 h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm"
        >
          {LANGS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-6 pt-1">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={!paid} onChange={() => setPaid(false)} /> Free
        </label>
        <label className="flex items-center gap-2 text-sm text-primary">
          <input type="radio" checked={paid} onChange={() => setPaid(true)} /> Paid
        </label>
      </div>
      {paid && (
        <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
      )}
      {progress ? <p className="text-sm text-sand">{progress}</p> : null}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? progress || "Uploading…" : "Submit"}
      </Button>
    </form>
  );
}

function TicketForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [host, setHost] = useState("");
  const [when, setWhen] = useState("");
  const [category, setCategory] = useState("Concert");
  const [location, setLocation] = useState("");
  const [about, setAbout] = useState("");
  const [poster, setPoster] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [price, setPrice] = useState("15");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mx-auto max-w-lg space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          let posterUrl = "/events/rooftop.jpg";
          if (poster) {
            const up = await uploadStudioAsset(poster, "poster");
            posterUrl = up.url;
          }
          await createTicketEvent({
            data: {
              title,
              hostName: host,
              startsAt: when ? new Date(when).toISOString() : "",
              category,
              location,
              about,
              posterUrl,
              priceCents: Math.round(Number(price) * 100),
            },
          });
          toast("Ticket listing is live");
          onDone();
        } catch (err) {
          toast(err instanceof Error ? err.message : "Could not create ticket");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-display text-2xl">Create Ticket</h2>
      <Drop
        label="Ticket Photo"
        hint="Poster selected"
        accept="image/*"
        preview={posterPreview}
        onFile={(f) => {
          setPoster(f);
          setPosterPreview(previewUrl(f));
        }}
      />
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event Name" required />
      <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="Name" />
      <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm"
      >
        {CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Select Google Location" />
      <textarea
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        rows={4}
        placeholder="About Event"
        className="w-full rounded-2xl border border-border bg-secondary p-3 text-sm"
      />
      <Label>Ticket price (USD)</Label>
      <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Uploading…" : "Submit"}
      </Button>
    </form>
  );
}

function LiveForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [price, setPrice] = useState("0");
  const [about, setAbout] = useState("");
  return (
    <form
      className="mx-auto max-w-lg space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await createLiveStream({
            data: {
              title,
              description: about,
              startsAt: when ? new Date(when).toISOString() : new Date().toISOString(),
              priceCents: Math.round(Number(price) * 100),
              posterUrl: "/events/rooftop.jpg",
            },
          });
          toast("Livestream scheduled");
          onDone();
        } catch (err) {
          toast(err instanceof Error ? err.message : "Could not go live");
        }
      }}
    >
      <h2 className="font-display text-2xl">Live Stream</h2>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Stream title" required />
      <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (0 = free)" />
      <textarea
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        rows={3}
        placeholder="What are you playing?"
        className="w-full rounded-2xl border border-border bg-secondary p-3 text-sm"
      />
      <Button type="submit" className="w-full">
        Go live
      </Button>
    </form>
  );
}

function AlbumForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("album");
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mx-auto max-w-lg space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          let coverUrl = "/covers/gold-coast.jpg";
          if (cover) {
            const up = await uploadStudioAsset(cover, "cover");
            coverUrl = up.url;
          }
          await createAlbum({
            data: { title, description: "", coverUrl, albumType: kind },
          });
          toast("Album created");
          onDone();
        } catch (err) {
          toast(err instanceof Error ? err.message : "Could not create album");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-display text-2xl">Create Album</h2>
      <Drop
        label="Album cover"
        hint="Cover selected"
        accept="image/*"
        preview={coverPreview}
        onFile={(f) => {
          setCover(f);
          setCoverPreview(previewUrl(f));
        }}
      />
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Album title" required />
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm"
      >
        <option value="single">Single</option>
        <option value="ep">EP</option>
        <option value="album">Album</option>
      </select>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Uploading…" : "Publish album"}
      </Button>
    </form>
  );
}

function PlaylistForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  return (
    <form
      className="mx-auto max-w-lg space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await createUserPlaylist({
            data: { title, description: "", coverUrl: "/covers/night-market.jpg" },
          });
          toast("Playlist created");
          onDone();
        } catch (err) {
          toast(err instanceof Error ? err.message : "Could not create playlist");
        }
      }}
    >
      <h2 className="font-display text-2xl">Create Playlist</h2>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Playlist name" required />
      <Button type="submit" className="w-full">
        Create
      </Button>
    </form>
  );
}

function VideoChatForm() {
  const navigate = useNavigate();
  const [mins, setMins] = useState("15");
  const [price, setPrice] = useState("20");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mx-auto max-w-lg space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = await upsertVideoCall({
            data: { durationMin: Number(mins) || 15, priceCents: Math.round(Number(price) * 100) },
          });
          toast("Waiting room is open");
          await navigate({ to: "/video/$id", params: { id: r.id } });
        } catch (err) {
          toast(err instanceof Error ? err.message : "Could not open chat");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-display text-2xl">1-1 Video Chat</h2>
      <p className="text-sm text-muted-foreground">
        Camera stays peer-to-peer. VerzZify only signs the room — nothing is uploaded to S3.
      </p>
      <Label>Duration (minutes)</Label>
      <Input type="number" min={5} max={60} value={mins} onChange={(e) => setMins(e.target.value)} />
      <Label>Price (USD)</Label>
      <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
      <Button type="submit" className="w-full" disabled={busy}>
        Open waiting room
      </Button>
    </form>
  );
}

function VideoHistory() {
  const q = useQuery({
    queryKey: ["video-history"],
    queryFn: () => listVideoChatHistory(),
  });
  const sessions = q.data?.sessions ?? [];
  return (
    <div className="mx-auto max-w-lg">
      <h2 className="font-display text-2xl">Video Chat History</h2>
      {q.data?.service && (
        <p className="mt-2 text-sm text-muted-foreground">
          Your rate: {q.data.service.durationMin} min · {formatMoney(q.data.service.priceCents)}
        </p>
      )}
      <ul className="mt-6 space-y-2">
        {sessions.map((s) => (
          <li key={s.id}>
            <Link
              to="/video/$id"
              params={{ id: s.id }}
              className="flex items-center justify-between rounded-2xl bg-card px-4 py-3"
            >
              <span>
                <span className="block text-sm font-medium">{s.fanName ?? s.artistName ?? "Session"}</span>
                <span className="block text-xs text-muted-foreground">
                  {s.durationMin} min · {formatMoney(s.priceCents)} · {s.status}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">{s.createdAt.slice(0, 10)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {sessions.length === 0 && !q.isPending && (
        <p className="mt-8 text-sm text-muted-foreground">No sessions yet.</p>
      )}
    </div>
  );
}
