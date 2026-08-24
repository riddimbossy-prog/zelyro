import { createServerFn } from "@tanstack/react-start";
import { rapidKey } from "./rapid-yt";
import type { TrackCard } from "./types";

const HOST = process.env.RAPIDAPI_BOOMPLAY_HOST?.trim() || "boomplay-api.p.rapidapi.com";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}
function str(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
}

function durationMs(raw: string) {
  const p = raw.split(":").map((n) => Number(n) || 0);
  if (p.length === 3) return ((p[0] * 3600 + p[1] * 60 + p[2]) * 1000);
  if (p.length === 2) return ((p[0] * 60 + p[1]) * 1000);
  return 0;
}

export type BoomplaySong = {
  musicId: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  cover: string;
  hdUrl: string;
  mdUrl: string;
  durationMs: number;
  explicit: boolean;
  countries: string;
};

export function boomplayConfigured() {
  return Boolean(rapidKey());
}

async function boomGet(path: string, query: Record<string, string> = {}): Promise<unknown> {
  const key = rapidKey();
  if (!key) throw new Error("RAPIDAPI_KEY is not set");
  const tryPaths = path.startsWith("/v1/") ? [path, path.replace(/^\/v1/, "")] : [path, `/v1${path}`];
  let last = "boomplay failed";
  for (const p of tryPaths) {
    const url = new URL(`https://${HOST}${p}`);
    for (const [k, v] of Object.entries(query)) if (v) url.searchParams.set(k, v);
    const res = await fetch(url, {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": HOST },
      signal: AbortSignal.timeout(10000),
    });
    const text = await res.text();
    if (res.ok) {
      try {
        return JSON.parse(text) as unknown;
      } catch {
        throw new Error("boomplay invalid JSON");
      }
    }
    last = `boomplay ${p} ${res.status}: ${text.slice(0, 160)}`;
    if (res.status !== 404) throw new Error(last);
  }
  throw new Error(last);
}

function mapSong(raw: Record<string, unknown>): BoomplaySong | null {
  const artist = asRecord(raw.beArtist) ?? {};
  const album = asRecord(raw.beAlbum) ?? {};
  const id = str(raw.musicID, raw.musicId, raw.id);
  const title = str(raw.name, raw.title);
  if (!id || !title) return null;
  return {
    musicId: id,
    title,
    artist: str(artist.name, raw.artist, "Boomplay"),
    artistId: str(artist.colID, artist.id, "boomplay"),
    album: str(album.name, raw.album),
    cover: str(raw.cover, album.smIconID, artist.smIconID, "/favicon.svg"),
    hdUrl: str(raw.hdSourceID, raw.mdSourceID, raw.ldSourceID),
    mdUrl: str(raw.mdSourceID, raw.ldSourceID, raw.hdSourceID),
    durationMs: durationMs(str(raw.deaution, raw.duration)),
    explicit: Number(raw.explicit) === 1,
    countries: str(raw.countrycodes),
  };
}

function pickSongs(json: unknown): BoomplaySong[] {
  const out: BoomplaySong[] = [];
  const walk = (v: unknown, depth: number) => {
    if (v == null || depth > 6) return;
    if (Array.isArray(v)) {
      for (const x of v) walk(x, depth + 1);
      return;
    }
    const o = asRecord(v);
    if (!o) return;
    if (o.musicID || o.hdSourceID || o.mdSourceID) {
      const song = mapSong(o);
      if (song) out.push(song);
    }
    if (Array.isArray(o.items)) walk(o.items, depth + 1);
    if (Array.isArray(o.data)) walk(o.data, depth + 1);
    if (o.itemType && o.items) walk(o.items, depth + 1);
  };
  walk(json, 0);
  const seen = new Set<string>();
  return out.filter((s) => {
    if (seen.has(s.musicId)) return false;
    seen.add(s.musicId);
    return Boolean(s.mdUrl || s.hdUrl);
  });
}

export function boomplayToTrack(s: BoomplaySong): TrackCard {
  return {
    id: `bp_${s.musicId}`,
    title: s.title,
    coverUrl: s.cover,
    audioUrl: `/api/v1/boomplay?id=${encodeURIComponent(s.musicId)}`,
    durationMs: s.durationMs,
    genre: "Afrobeats",
    distribution: "boomplay",
    priceCents: 0,
    currency: "USD",
    playCount: 0,
    likeCount: 0,
    albumId: null,
    albumTitle: s.album || null,
    lyrics: null,
    explicit: s.explicit,
    featuredArtists: null,
    producer: null,
    songwriter: null,
    copyrightOwner: null,
    country: null,
    artistId: `bp_artist_${s.artistId}`,
    artistName: s.artist,
    artistSlug: s.artist.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    artistAvatar: s.cover,
    verified: false,
  };
}

const songCache = new Map<string, BoomplaySong>();

export async function searchBoomplay(q: string, type = "music"): Promise<BoomplaySong[]> {
  const json = await boomGet("/search", { q: q.slice(0, 80), type, page: "1" });
  const songs = pickSongs(json);
  for (const s of songs) songCache.set(s.musicId, s);
  return songs;
}

export async function getBoomplaySong(id: string): Promise<BoomplaySong | null> {
  const hit = songCache.get(id);
  if (hit) return hit;
  const json = await boomGet(`/music/${encodeURIComponent(id)}`);
  const songs = pickSongs(json);
  const song = songs[0] ?? mapSong(asRecord(json) ?? {});
  if (song) songCache.set(song.musicId, song);
  return song;
}

const HOME_Q: Record<string, string> = {
  GH: "ghana afrobeats",
  NG: "nigeria afrobeats",
  CI: "magic system",
  ZA: "amapiano",
  KE: "kenya music",
  SN: "senegal mbalax",
  JM: "dancehall",
  US: "afrobeats",
  GB: "afrobeats",
};

const homeCache = new Map<string, { at: number; tracks: TrackCard[] }>();

export async function loadBoomplayHome(region: string): Promise<TrackCard[]> {
  const code = region.toUpperCase();
  const hit = homeCache.get(code);
  if (hit && Date.now() - hit.at < 30 * 60 * 1000) return hit.tracks;
  if (!boomplayConfigured()) return [];
  const q = HOME_Q[code] ?? "afrobeats";
  try {
    const tracks = (await searchBoomplay(q, "music")).slice(0, 16).map(boomplayToTrack);
    homeCache.set(code, { at: Date.now(), tracks });
    return tracks;
  } catch {
    return [];
  }
}

export const getBoomplayHome = createServerFn({ method: "GET" })
  .validator((region: string) => region || "GH")
  .handler(async ({ data: region }) => loadBoomplayHome(region));

export const searchBoomplayTracks = createServerFn({ method: "GET" })
  .validator((q: string) => q.trim().slice(0, 80))
  .handler(async ({ data: q }) => {
    if (!q || !boomplayConfigured()) return [] as TrackCard[];
    try {
      return (await searchBoomplay(q, "music")).slice(0, 12).map(boomplayToTrack);
    } catch {
      return [];
    }
  });
