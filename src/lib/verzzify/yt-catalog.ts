import { createServerFn } from "@tanstack/react-start";
import type { YouTubeVideo, YtArtistCard } from "./types";
import { artistsFromVideos, filterVideosForRegion, normalizeRegion, REGION_NAMES } from "./yt-charts";

export const MUSIC_GENRES = [
  { id: "pop", label: "Pop", q: "pop official music video" },
  { id: "hiphop", label: "Hip hop", q: "hip hop rap official" },
  { id: "rnb", label: "R&B", q: "rnb official music video" },
  { id: "afrobeats", label: "Afrobeats", q: "afrobeats official" },
  { id: "amapiano", label: "Amapiano", q: "amapiano official" },
  { id: "highlife", label: "Highlife", q: "highlife official" },
  { id: "dancehall", label: "Dancehall", q: "dancehall official" },
  { id: "reggae", label: "Reggae", q: "reggae official" },
  { id: "gospel", label: "Gospel", q: "gospel music official" },
  { id: "latin", label: "Latin", q: "latin urbano official" },
  { id: "reggaeton", label: "Reggaeton", q: "reggaeton official" },
  { id: "kpop", label: "K-pop", q: "kpop official mv" },
  { id: "jpop", label: "J-pop", q: "jpop official" },
  { id: "bollywood", label: "Bollywood", q: "bollywood songs official" },
  { id: "electronic", label: "Electronic", q: "edm official music video" },
  { id: "house", label: "House", q: "house music official" },
  { id: "afrohouse", label: "Afro house", q: "afro house official" },
  { id: "rock", label: "Rock", q: "rock official music video" },
  { id: "indie", label: "Indie", q: "indie official music video" },
  { id: "country", label: "Country", q: "country music official" },
  { id: "jazz", label: "Jazz", q: "jazz official" },
  { id: "drill", label: "Drill", q: "drill official" },
  { id: "funk", label: "Funk", q: "brazilian funk official" },
  { id: "coupedecale", label: "Coupé-décalé", q: "coupe decale official" },
  { id: "zouglou", label: "Zouglou", q: "zouglou official" },
] as const;

export type GenreId = (typeof MUSIC_GENRES)[number]["id"];

export const CATALOG_COUNTRIES = Object.keys(REGION_NAMES)
  .sort((a, b) => REGION_NAMES[a].localeCompare(REGION_NAMES[b]))
  .map((code) => ({ code, name: REGION_NAMES[code] }));

const cache = new Map<string, { at: number; data: CountryGenreCatalog }>();
const TTL = 45 * 60 * 1000;

function mapItem(v: {
  id: string;
  snippet?: {
    title?: string;
    channelTitle?: string;
    channelId?: string;
    publishedAt?: string;
    description?: string;
    thumbnails?: { high?: { url?: string }; default?: { url?: string } };
  };
  statistics?: { viewCount?: string; likeCount?: string };
}): YouTubeVideo {
  return {
    videoId: v.id,
    title: v.snippet?.title ?? "YouTube video",
    thumbnailUrl: v.snippet?.thumbnails?.high?.url ?? `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
    channelName: v.snippet?.channelTitle ?? "YouTube",
    channelId: v.snippet?.channelId ?? null,
    channelUrl: v.snippet?.channelId ? `https://www.youtube.com/channel/${v.snippet.channelId}` : null,
    publishedAt: v.snippet?.publishedAt ?? null,
    description: v.snippet?.description ?? null,
    durationSeconds: null,
    embeddable: true,
    url: `https://www.youtube.com/watch?v=${v.id}`,
    viewCount: v.statistics?.viewCount ? Number(v.statistics.viewCount) : null,
    likeCount: v.statistics?.likeCount ? Number(v.statistics.likeCount) : null,
    source: "youtube",
  };
}

async function searchSlice(region: string, q: string, key: string): Promise<YouTubeVideo[]> {
  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&regionCode=${encodeURIComponent(region)}&maxResults=50&q=${encodeURIComponent(q)}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: Array<{ id?: { videoId?: string } }> };
  const ids = (json.items ?? []).map((i) => i.id?.videoId).filter(Boolean) as string[];
  if (!ids.length) return [];
  const vurl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,status&id=${ids.join(",")}&key=${key}`;
  const vres = await fetch(vurl);
  if (!vres.ok) return [];
  const body = (await vres.json()) as { items?: Parameters<typeof mapItem>[0][] };
  return (body.items ?? []).map(mapItem);
}

async function hydrateArtists(videos: YouTubeVideo[], key: string): Promise<YtArtistCard[]> {
  const base = artistsFromVideos(videos);
  const ids = base.map((a) => a.channelId).filter((id) => id.startsWith("UC")).slice(0, 50);
  if (!ids.length) return base;
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${ids.join(",")}&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return base;
    const json = (await res.json()) as {
      items?: Array<{
        id: string;
        snippet?: { title?: string; thumbnails?: { medium?: { url?: string }; default?: { url?: string } } };
        statistics?: { subscriberCount?: string };
      }>;
    };
    const byId = new Map((json.items ?? []).map((i) => [i.id, i]));
    return base.map((a) => {
      const hit = byId.get(a.channelId);
      if (!hit) return a;
      return {
        ...a,
        channelName: hit.snippet?.title ?? a.channelName,
        avatarUrl: hit.snippet?.thumbnails?.medium?.url ?? hit.snippet?.thumbnails?.default?.url ?? a.avatarUrl,
      };
    });
  } catch {
    return base;
  }
}

export type CountryGenreCatalog = {
  region: string;
  regionName: string;
  genre: string;
  genreLabel: string;
  videos: YouTubeVideo[];
  artists: YtArtistCard[];
};

export function catalogTaxonomy() {
  return { countries: CATALOG_COUNTRIES, genres: MUSIC_GENRES.map(({ id, label }) => ({ id, label })) };
}

const SCENE_QUERY: Record<string, Record<string, string>> = {
  CI: {
    afrobeats: "coupe decale abidjan DJ Arafat Serge Beynaud",
    amapiano: "coupe decale ivoire",
    highlife: "zouglou magic system ivoire",
    pop: "magic system 1er gaou",
    hiphop: "rap ivoire Didi B Kiff No Beat",
    dancehall: "coupe decale DJ Arafat",
    reggae: "alpha blondy tiken jah fakoly",
    coupedecale: "coupe decale DJ Arafat Mix Premier",
    zouglou: "zouglou magic system ivoire",
  },
  GH: {
    afrobeats: "ghana afrobeats black sherif king promise",
    highlife: "highlife ghana official",
  },
};

export async function loadCountryGenre(region: string, genreId: string): Promise<CountryGenreCatalog> {
  const code = normalizeRegion(region);
  const genre = MUSIC_GENRES.find((g) => g.id === genreId) ?? MUSIC_GENRES[0];
  const cacheKey = `v3:${code}:${genre.id}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const key = process.env.YOUTUBE_API_KEY?.trim();
  const country = REGION_NAMES[code] ?? code;
  const q = SCENE_QUERY[code]?.[genre.id] ?? `${genre.q} ${country}`;
  let videos = key ? filterVideosForRegion(code, await searchSlice(code, q, key)) : [];
  if (!videos.length) {
    const { getPopularMusicByCountry } = await import("./yt-charts");
    videos = filterVideosForRegion(code, await getPopularMusicByCountry(code));
  }
  const artists = key ? await hydrateArtists(videos, key) : artistsFromVideos(videos);
  const data: CountryGenreCatalog = {
    region: code,
    regionName: country,
    genre: genre.id,
    genreLabel: genre.label,
    videos,
    artists,
  };
  cache.set(cacheKey, { at: Date.now(), data });
  return data;
}

export const getCatalogTaxonomy = createServerFn({ method: "GET" }).handler(async () => catalogTaxonomy());

export const getCountryGenreCatalog = createServerFn({ method: "GET" })
  .validator((d: { region: string; genre: string }) => ({
    region: normalizeRegion(d.region),
    genre: d.genre.trim().toLowerCase().slice(0, 32),
  }))
  .handler(async ({ data }) => loadCountryGenre(data.region, data.genre));
