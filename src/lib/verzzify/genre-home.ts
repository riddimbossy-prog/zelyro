import { createServerFn } from "@tanstack/react-start";
import { getGenre, genreQueries, type GenreDef } from "./genres";
import {
  artistsFromVideos,
  filterVideosForRegion,
  loadYoutubeHome,
  normalizeRegion,
  REGION_NAMES,
  type YoutubeHomeData,
} from "./yt-charts";
import type { YouTubeVideo, YtArtistCard, YtPlaylistCard } from "./types";
import { getViewerGeo } from "./geo";

export type GenreHomeData = {
  genre: GenreDef;
  region: string;
  regionName: string;
  city: string | null;
  videos: YouTubeVideo[];
  newSongs: YouTubeVideo[];
  artists: YtArtistCard[];
  playlists: YtPlaylistCard[];
  nearby: YoutubeHomeData["nearby"];
  feed: YouTubeVideo[];
  rails: { id: string; title: string; subtitle: string; videos: YouTubeVideo[] }[];
};

function mapSearchItem(v: {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    channelId?: string;
    publishedAt?: string;
    description?: string;
    thumbnails?: { high?: { url?: string } };
  };
}): YouTubeVideo | null {
  const id = v.id?.videoId;
  if (!id) return null;
  return {
    videoId: id,
    title: v.snippet?.title ?? "VerzZify cut",
    thumbnailUrl: v.snippet?.thumbnails?.high?.url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    channelName: v.snippet?.channelTitle ?? "VerzZify",
    channelId: v.snippet?.channelId ?? null,
    channelUrl: v.snippet?.channelId ? `https://www.youtube.com/channel/${v.snippet.channelId}` : null,
    publishedAt: v.snippet?.publishedAt ?? null,
    description: v.snippet?.description ?? null,
    durationSeconds: null,
    embeddable: true,
    url: `https://www.youtube.com/watch?v=${id}`,
    viewCount: null,
    likeCount: null,
    source: "youtube",
  };
}

async function searchGenre(
  code: string,
  q: string,
  key: string,
  order: "relevance" | "viewCount" | "date" = "relevance",
): Promise<YouTubeVideo[]> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&regionCode=${encodeURIComponent(code)}&maxResults=15&order=${order}&q=${encodeURIComponent(q)}&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = (await res.json()) as { items?: Parameters<typeof mapSearchItem>[0][] };
    return (json.items ?? []).map(mapSearchItem).filter(Boolean) as YouTubeVideo[];
  } catch {
    return [];
  }
}

function dedupe(list: YouTubeVideo[]): YouTubeVideo[] {
  const seen = new Set<string>();
  const out: YouTubeVideo[] = [];
  for (const v of list) {
    if (!v.videoId || seen.has(v.videoId)) continue;
    seen.add(v.videoId);
    out.push(v);
  }
  return out;
}

const cache = new Map<string, { at: number; data: GenreHomeData }>();
const TTL = 15 * 60 * 1000;

export async function loadGenreHome(
  slug: string,
  region?: string | null,
  city: string | null = null,
): Promise<GenreHomeData | null> {
  const genre = getGenre(slug);
  if (!genre) return null;
  const code = normalizeRegion(region);
  const cacheKey = `${genre.slug}:${code}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const name = REGION_NAMES[code] ?? code;
  const key = process.env.YOUTUBE_API_KEY?.trim();
  const queries = genreQueries(genre, code, name);

  let videos: YouTubeVideo[] = [];
  let newSongs: YouTubeVideo[] = [];
  const rails: GenreHomeData["rails"] = [];

  if (key) {
    const [popularBatches, fresh] = await Promise.all([
      Promise.all(queries.slice(0, 3).map((q) => searchGenre(code, q, key, "viewCount"))),
      searchGenre(code, `${queries[0] ?? genre.name} 2026`, key, "date"),
    ]);
    videos = dedupe(filterVideosForRegion(code, popularBatches.flat()));
    newSongs = dedupe(filterVideosForRegion(code, fresh)).filter(
      (v) => !videos.some((x) => x.videoId === v.videoId),
    );

    for (const q of queries.slice(0, 3)) {
      const list = dedupe(
        filterVideosForRegion(code, await searchGenre(code, q, key, "relevance")),
      ).filter((v) => !videos.some((x) => x.videoId === v.videoId));
      if (list.length >= 4) {
        rails.push({
          id: `${genre.slug}-${q.slice(0, 24).replace(/\s+/g, "-")}`,
          title: genre.name,
          subtitle: q.replace(name, "").trim() || `${name} catalog`,
          videos: list.slice(0, 12),
        });
      }
    }
  }

  // Fallback: reuse regional home and soft-filter by genre keywords
  if (videos.length < 6) {
    const home = await loadYoutubeHome(code, city);
    const needles = [genre.name, genre.slug.replace(/-/g, " "), ...genre.queries]
      .join(" ")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const soft = home.videos.filter((v) => {
      const blob = `${v.title} ${v.channelName}`.toLowerCase();
      return needles.some((n) => blob.includes(n));
    });
    videos = dedupe([...videos, ...soft, ...home.videos]).slice(0, 28);
    if (!newSongs.length) newSongs = home.newSongs ?? [];
  }

  const homeNear = await loadYoutubeHome(code, city);
  const nearby = await Promise.all(
    homeNear.nearby.map(async (n) => {
      if (!key) return { ...n, videos: n.videos.slice(0, 8), artists: n.artists.slice(0, 8) };
      const q = genreQueries(genre, n.region, n.regionName)[0] ?? `${genre.name} ${n.regionName}`;
      const nv = dedupe(filterVideosForRegion(n.region, await searchGenre(n.region, q, key, "viewCount")));
      const list = nv.length ? nv : n.videos;
      return {
        region: n.region,
        regionName: n.regionName,
        videos: list.slice(0, 12),
        artists: artistsFromVideos(list).slice(0, 10),
      };
    }),
  );

  const artists = artistsFromVideos(videos);
  const cover = (list: YouTubeVideo[]) => list[0]?.thumbnailUrl ?? "/covers/night-market.jpg";
  const playlists: YtPlaylistCard[] = [
    {
      id: `${genre.slug}-hot-${code}`,
      title: `${genre.name} · ${name}`,
      subtitle: "Hottest in your area",
      thumbnailUrl: cover(videos),
      videos: videos.slice(0, 10),
    },
    {
      id: `${genre.slug}-new-${code}`,
      title: `New ${genre.name}`,
      subtitle: "Fresh this week",
      thumbnailUrl: cover(newSongs.length ? newSongs : videos),
      videos: (newSongs.length ? newSongs : videos).slice(0, 10),
    },
    {
      id: `${genre.slug}-drive-${code}`,
      title: `${genre.name} drive mix`,
      subtitle: `Playlists for ${name}`,
      thumbnailUrl: cover(videos.slice(2)),
      videos: videos.slice(2, 12),
    },
  ].filter((p) => p.videos.length);

  const feed = dedupe([...newSongs.slice(0, 4), ...videos]).slice(0, 18);

  const data: GenreHomeData = {
    genre,
    region: code,
    regionName: name,
    city,
    videos,
    newSongs,
    artists,
    playlists,
    nearby,
    feed,
    rails,
  };
  cache.set(cacheKey, { at: Date.now(), data });
  return data;
}

export const getGenreHome = createServerFn({ method: "GET" })
  .validator((d: { slug: string; region?: string }) => ({
    slug: String(d.slug || "").toLowerCase().slice(0, 40),
    region: d.region ? normalizeRegion(d.region) : undefined,
  }))
  .handler(async ({ data }) => {
    let region = data.region;
    let city: string | null = null;
    if (!region) {
      try {
        const geo = await getViewerGeo();
        region = geo.region;
        city = geo.city;
      } catch {
        region = "US";
      }
    }
    return loadGenreHome(data.slug, region, city);
  });
