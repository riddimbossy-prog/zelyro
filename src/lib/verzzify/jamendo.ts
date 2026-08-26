import { createServerFn } from "@tanstack/react-start";
import type { TrackCard } from "./types";

const BASE = "https://api.jamendo.com/v3.0";

function cleanEnv(raw: string | undefined): string | undefined {
  const v = raw?.trim().replace(/^['"]|['"]$/g, "");
  return v || undefined;
}

/** Prefer Client ID. CLIENT_KEY is accepted because Render was set with that name. */
export function jamendoClientId(): string | undefined {
  return (
    cleanEnv(process.env.JAMENDO_CLIENT_ID) ||
    cleanEnv(process.env.JAMENDO_CLIENT_KEY) ||
    cleanEnv(process.env.JAMENDO_API_KEY) ||
    cleanEnv(process.env.JAMENDO_KEY) ||
    cleanEnv(process.env.JAMENDO_CLIENTID)
  );
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

export type JamendoCallMeta = {
  ok: boolean;
  code: number | null;
  status: string | null;
  error?: string;
  resultsCount: number;
  warnings?: string;
};

let lastCall: JamendoCallMeta | null = null;
export function lastJamendoCall(): JamendoCallMeta | null {
  return lastCall;
}

async function jamGetOnce(path: string, params: Record<string, string>): Promise<unknown> {
  const clientId = jamendoClientId();
  if (!clientId) throw new Error("JAMENDO_CLIENT_ID is not set");
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) {
    if (!v) continue;
    url.searchParams.set(k, v.replace(/\+/g, " "));
  }
  const res = await fetch(url.toString(), {
    headers: { accept: "application/json", "user-agent": "VerzZify/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    lastCall = { ok: false, code: res.status, status: "http", error: `non-JSON ${res.status}`, resultsCount: 0 };
    throw new Error(`Jamendo ${res.status}: ${text.slice(0, 160)}`);
  }
  const headers = asRecord(asRecord(json)?.headers);
  const status = str(headers?.status) || (res.ok ? "success" : "failed");
  const code = Number(headers?.code);
  const errMsg = str(headers?.error_message);
  const warnings = str(headers?.warnings);
  const resultsCount = Number(headers?.results_count ?? 0);
  lastCall = {
    ok: status === "success" && (Number.isNaN(code) || code === 0),
    code: Number.isNaN(code) ? res.status : code,
    status,
    error: errMsg || undefined,
    resultsCount,
    warnings: warnings || undefined,
  };
  if (!lastCall.ok) throw new Error(errMsg || `Jamendo ${status} code ${lastCall.code}`);
  return json;
}

/** Jamendo often returns success + 0 results when burst-limited. Retry those. */
async function jamGet(path: string, params: Record<string, string> = {}): Promise<unknown> {
  let json: unknown = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await sleep(250 * attempt);
    json = await jamGetOnce(path, params);
    if ((lastCall?.resultsCount ?? 0) > 0) return json;
  }
  return json;
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
  const cover = t.album_image || t.image || "/favicon.svg";
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

export const JAMENDO_MOODS = [
  { id: "focus", label: "Focus", tags: "instrumental", color: "from-sky-600 to-indigo-700" },
  { id: "night", label: "Night drive", tags: "electronic", color: "from-violet-700 to-fuchsia-800" },
  { id: "sunday", label: "Sunday light", tags: "acoustic", color: "from-amber-500 to-orange-700" },
  { id: "energy", label: "Energy", tags: "rock", color: "from-rose-600 to-red-800" },
  { id: "afro", label: "Afro world", tags: "world", color: "from-emerald-600 to-teal-800" },
  { id: "gospel", label: "Spirit", tags: "soul", color: "from-yellow-600 to-amber-800" },
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
  const params: Record<string, string> = {
    limit: String(Math.min(50, Math.max(1, opts.limit ?? 20))),
    offset: String(opts.offset ?? 0),
  };
  if (opts.q?.trim()) {
    params.search = opts.q.trim().slice(0, 80);
    params.order = opts.order || "relevance";
  } else if (opts.order) {
    params.order = opts.order;
  }
  if (opts.tags?.trim()) params.fuzzytags = opts.tags.trim();
  const json = await jamGet("/tracks/", params);
  return pickResults(json);
}

export async function getJamendoTrack(id: string): Promise<JamendoTrack | null> {
  if (!jamendoConfigured() || !id) return null;
  const json = await jamGet("/tracks/", { id, audioformat: "mp32" });
  return pickResults(json)[0] ?? null;
}

export type JamendoHomePack = {
  popular: TrackCard[];
  fresh: TrackCard[];
  freeKeep: TrackCard[];
  moods: Record<string, TrackCard[]>;
  error?: string;
};

const homeCache = new Map<string, { at: number; data: JamendoHomePack }>();

async function settledTracks(fn: () => Promise<JamendoTrack[]>): Promise<JamendoTrack[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

export async function loadJamendoHome(): Promise<JamendoHomePack> {
  const emptyMoods: Record<string, TrackCard[]> = {};
  for (const m of JAMENDO_MOODS) emptyMoods[m.id] = [];
  const empty: JamendoHomePack = { popular: [], fresh: [], freeKeep: [], moods: emptyMoods };
  if (!jamendoConfigured()) return { ...empty, error: "JAMENDO_CLIENT_ID is not set" };

  const hit = homeCache.get("all");
  if (hit && Date.now() - hit.at < 15 * 60 * 1000 && hit.data.popular.length > 0) return hit.data;

  const popularRaw = await settledTracks(() => searchJamendoTracks({ order: "popularity_total", limit: 16 }));
  await sleep(120);
  const freshRaw = await settledTracks(() => searchJamendoTracks({ order: "releasedate_desc", limit: 12 }));
  await sleep(120);
  const freeRaw = await settledTracks(() => searchJamendoTracks({ order: "popularity_week", limit: 12 }));

  const moodRaws: JamendoTrack[][] = [];
  for (const m of JAMENDO_MOODS) {
    await sleep(120);
    moodRaws.push(await settledTracks(() => searchJamendoTracks({ tags: m.tags, limit: 10 })));
  }

  const popular = popularRaw.map(jamendoToTrack);
  const seen = new Set(popular.map((t) => t.id));
  const fresh = freshRaw
    .map(jamendoToTrack)
    .filter((t) => !seen.has(t.id))
    .slice(0, 12);

  const freeKeep = freeRaw
    .filter((t) => t.audiodownload_allowed || t.audiodownload)
    .map(jamendoToTrack)
    .slice(0, 10);

  const moods: Record<string, TrackCard[]> = {};
  JAMENDO_MOODS.forEach((m, i) => {
    moods[m.id] = (moodRaws[i] ?? []).map(jamendoToTrack);
  });

  const data: JamendoHomePack = {
    popular,
    fresh,
    freeKeep: freeKeep.length ? freeKeep : popular.slice(0, 8),
    moods,
    error: popular.length ? undefined : lastCall?.error || "Jamendo returned no tracks",
  };
  if (popular.length) homeCache.set("all", { at: Date.now(), data });
  return data;
}

export async function pingJamendo(): Promise<{
  configured: boolean;
  ok: boolean;
  env: string | null;
  keyPrefix: string | null;
  keyLength: number;
  error?: string;
  code?: number | null;
  resultsCount?: number;
}> {
  const present = [
    ["JAMENDO_CLIENT_ID", process.env.JAMENDO_CLIENT_ID],
    ["JAMENDO_CLIENT_KEY", process.env.JAMENDO_CLIENT_KEY],
    ["JAMENDO_API_KEY", process.env.JAMENDO_API_KEY],
    ["JAMENDO_KEY", process.env.JAMENDO_KEY],
    ["JAMENDO_CLIENTID", process.env.JAMENDO_CLIENTID],
  ].find(([, v]) => Boolean(cleanEnv(v)));
  const id = jamendoClientId();
  if (!id) {
    return { configured: false, ok: false, env: null, keyPrefix: null, keyLength: 0, error: "missing client id" };
  }
  try {
    const tracks = await searchJamendoTracks({ limit: 3 });
    return {
      configured: true,
      ok: tracks.length > 0,
      env: present?.[0] ?? "JAMENDO_CLIENT_ID",
      keyPrefix: `${id.slice(0, 4)}…`,
      keyLength: id.length,
      error: tracks.length ? lastCall?.warnings : lastCall?.error || "empty results",
      code: lastCall?.code,
      resultsCount: tracks.length,
    };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      env: present?.[0] ?? "JAMENDO_CLIENT_ID",
      keyPrefix: `${id.slice(0, 4)}…`,
      keyLength: id.length,
      error: err instanceof Error ? err.message : "jamendo failed",
      code: lastCall?.code,
      resultsCount: lastCall?.resultsCount ?? 0,
    };
  }
}

export const getJamendoHome = createServerFn({ method: "GET" }).handler(async () => loadJamendoHome());

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
