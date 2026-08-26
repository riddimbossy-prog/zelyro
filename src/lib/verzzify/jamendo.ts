import { createServerFn } from "@tanstack/react-start";
import type { TrackCard } from "./types";

const BASE = "https://api.jamendo.com/v3.0";

export function jamendoClientId(): string | undefined {
  return process.env.JAMENDO_CLIENT_ID?.trim() || process.env.JAMENDO_API_KEY?.trim() || undefined;
}

export function jamendoConfigured(): boolean {
  return Boolean(jamendoClientId());
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

export type JamendoTrack = {
  id: string;
  name: string;
  duration: number;
  artist_id: string;
  artist_name: string;
  artist_idstr?: string;
  album_name?: string;
  album_image?: string;
  image?: string;
  audio?: string;
  audiodownload?: string;
  audiodownload_allowed?: boolean;
  license_ccurl?: string;
  musicinfo?: { tags?: { genres?: string[]; vartags?: string[] } };
};

async function jamGet(path: string, params: Record<string, string> = {}): Promise<unknown> {
  const clientId = jamendoClientId();
  if (!clientId) throw new Error("JAMENDO_CLIENT_ID is not set");
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Jamendo ${res.status}: ${text.slice(0, 160)}`);
  }
  return res.json();
}

function pickResults(json: unknown): JamendoTrack[] {
  const rec = asRecord(json);
  const results = rec?.results;
  if (!Array.isArray(results)) return [];
  return results
    .map((row) => {
      const o = asRecord(row);
      if (!o) return null;
      const id = str(o.id);
      const name = str(o.name);
      if (!id || !name) return null;
      return {
        id,
        name,
        duration: Number(o.duration) || 0,
        artist_id: str(o.artist_id, "0"),
        artist_name: str(o.artist_name, "Artist"),
        artist_idstr: str(o.artist_idstr) || undefined,
        album_name: str(o.album_name) || undefined,
        album_image: str(o.album_image) || undefined,
        image: str(o.image) || undefined,
        audio: str(o.audio) || undefined,
        audiodownload: str(o.audiodownload) || undefined,
        audiodownload_allowed: Boolean(o.audiodownload_allowed),
        license_ccurl: str(o.license_ccurl) || undefined,
        musicinfo: o.musicinfo as JamendoTrack["musicinfo"],
      } satisfies JamendoTrack;
    })
    .filter(Boolean) as JamendoTrack[];
}

function genreFrom(t: JamendoTrack): string {
  const tags = t.musicinfo?.tags;
  const g = tags?.genres?.[0] || tags?.vartags?.[0];
  return g ? g.replace(/_/g, " ") : "Independent";
}

export function jamendoToTrack(t: JamendoTrack): TrackCard {
  const slug =
    t.artist_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "artist";
  const cover =
    t.album_image ||
    t.image ||
    `https://usercontent.jamendo.com?type=album&id=0&width=300`;
  // Prefer direct stream URL from Jamendo (licensed); fallback to our proxy path
  const audio = t.audio || `/api/v1/jamendo?id=${encodeURIComponent(t.id)}&stream=1`;
  return {
    id: `jm_${t.id}`,
    title: t.name,
    coverUrl: cover,
    audioUrl: audio,
    durationMs: (t.duration || 0) * 1000,
    genre: genreFrom(t),
    distribution: "jamendo",
    priceCents: 0,
    currency: "USD",
    playCount: 0,
    likeCount: 0,
    albumId: null,
    albumTitle: t.album_name ?? null,
    lyrics: null,
    explicit: false,
    featuredArtists: null,
    producer: null,
    songwriter: null,
    copyrightOwner: t.license_ccurl ?? "Jamendo",
    country: null,
    artistId: `jm_artist_${t.artist_id}`,
    artistName: t.artist_name,
    artistSlug: slug,
    artistAvatar: cover,
    verified: false,
  };
}

/** Mood / activity chips mapped to Jamendo fuzzy tags */
export const JAMENDO_MOODS = [
  { id: "focus", label: "Focus", tags: "instrumental+calm", color: "from-sky-600 to-indigo-700" },
  { id: "night", label: "Night drive", tags: "electronic+chill", color: "from-violet-700 to-fuchsia-800" },
  { id: "sunday", label: "Sunday light", tags: "acoustic+folk", color: "from-amber-500 to-orange-700" },
  { id: "energy", label: "Energy", tags: "rock+upbeat", color: "from-rose-600 to-red-800" },
  { id: "afro", label: "Afro world", tags: "african+world", color: "from-emerald-600 to-teal-800" },
  { id: "gospel", label: "Spirit", tags: "gospel+soul", color: "from-yellow-600 to-amber-800" },
] as const;

export type JamendoMoodId = (typeof JAMENDO_MOODS)[number]["id"];

export async function searchJamendoTracks(opts: {
  q?: string;
  tags?: string;
  order?: string;
  limit?: number;
  offset?: number;
}): Promise<JamendoTrack[]> {
  if (!jamendoConfigured()) return [];
  const limit = String(Math.min(50, Math.max(1, opts.limit ?? 20)));
  const params: Record<string, string> = {
    limit,
    offset: String(opts.offset ?? 0),
    order: opts.order ?? "popularity_total",
    include: "musicinfo",
    audioformat: "mp32",
  };
  if (opts.q?.trim()) params.search = opts.q.trim().slice(0, 80);
  if (opts.tags?.trim()) params.fuzzytags = opts.tags.trim();
  const json = await jamGet("/tracks/", params);
  return pickResults(json).filter((t) => Boolean(t.audio || t.audiodownload));
}

export async function getJamendoTrack(id: string): Promise<JamendoTrack | null> {
  if (!jamendoConfigured() || !id) return null;
  const json = await jamGet("/tracks/", {
    id,
    include: "musicinfo",
    audioformat: "mp32",
  });
  return pickResults(json)[0] ?? null;
}

export type JamendoHomePack = {
  popular: TrackCard[];
  fresh: TrackCard[];
  freeKeep: TrackCard[];
  moods: Record<string, TrackCard[]>;
};

const homeCache = new Map<string, { at: number; data: JamendoHomePack }>();

export async function loadJamendoHome(): Promise<JamendoHomePack> {
  const empty: JamendoHomePack = { popular: [], fresh: [], freeKeep: [], moods: {} };
  if (!jamendoConfigured()) return empty;

  const hit = homeCache.get("all");
  if (hit && Date.now() - hit.at < 20 * 60 * 1000) return hit.data;

  try {
    const [popularRaw, freshRaw, freeRaw, ...moodRaws] = await Promise.all([
      searchJamendoTracks({ order: "popularity_total", limit: 16 }),
      searchJamendoTracks({ order: "releasedate_desc", limit: 12 }),
      searchJamendoTracks({ order: "popularity_month", limit: 12 }),
      ...JAMENDO_MOODS.map((m) => searchJamendoTracks({ tags: m.tags, limit: 10 })),
    ]);

    const popular = popularRaw.map(jamendoToTrack);
    const seen = new Set(popular.map((t) => t.id));
    const fresh = freshRaw
      .map(jamendoToTrack)
      .filter((t) => !seen.has(t.id))
      .slice(0, 12);

    // Free to keep = download allowed when Jamendo marks it
    const freeKeep = freeRaw
      .filter((t) => t.audiodownload_allowed)
      .map(jamendoToTrack)
      .slice(0, 10);

    const moods: Record<string, TrackCard[]> = {};
    JAMENDO_MOODS.forEach((m, i) => {
      moods[m.id] = (moodRaws[i] ?? []).map(jamendoToTrack);
    });

    const data: JamendoHomePack = { popular, fresh, freeKeep, moods };
    homeCache.set("all", { at: Date.now(), data });
    return data;
  } catch {
    return empty;
  }
}

export const getJamendoHome = createServerFn({ method: "GET" }).handler(async () =>
  loadJamendoHome(),
);

export const searchJamendo = createServerFn({ method: "GET" })
  .validator((q: string) => q.trim().slice(0, 80))
  .handler(async ({ data: q }) => {
    if (!q || !jamendoConfigured()) return [] as TrackCard[];
    try {
      return (await searchJamendoTracks({ q, limit: 16 })).map(jamendoToTrack);
    } catch {
      return [];
    }
  });

export const getJamendoMood = createServerFn({ method: "GET" })
  .validator((id: string) => id.trim())
  .handler(async ({ data: id }) => {
    const mood = JAMENDO_MOODS.find((m) => m.id === id);
    if (!mood || !jamendoConfigured()) return [] as TrackCard[];
    try {
      return (await searchJamendoTracks({ tags: mood.tags, limit: 20 })).map(jamendoToTrack);
    } catch {
      return [];
    }
  });
