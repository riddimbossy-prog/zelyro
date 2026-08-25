import type { TrackCard, YouTubeVideo } from "./types";

const YT_ID = /^[a-zA-Z0-9_-]{11}$/;

export function extractVideoId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (YT_ID.test(raw)) return raw;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  if (
    host === "youtu.be" ||
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && YT_ID.test(id) ? id : null;
    }
    const v = url.searchParams.get("v");
    if (v && YT_ID.test(v)) return v;
    const parts = url.pathname.split("/").filter(Boolean);
    const nested =
      parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live" || parts[0] === "v";
    if (nested && parts[1] && YT_ID.test(parts[1])) return parts[1];
  }
  return null;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeEmbedUrl(videoId: string, autoplay = false): string {
  const q = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
  });
  if (autoplay) q.set("autoplay", "1");
  return `https://www.youtube.com/embed/${videoId}?${q.toString()}`;
}

export function getVideoThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeApiKey(): string | undefined {
  const k = process.env.YOUTUBE_API_KEY?.trim();
  return k || undefined;
}

function apiKey(): string | undefined {
  return youtubeApiKey();
}

function parseIsoDuration(iso?: string): number | null {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
}

type DataVideo = {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    channelId?: string;
    publishedAt?: string;
    thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
  };
  contentDetails?: { duration?: string };
  status?: { embeddable?: boolean; privacyStatus?: string };
  statistics?: { viewCount?: string; likeCount?: string };
};

function mapDataVideo(v: DataVideo): YouTubeVideo {
  const id = v.id;
  return {
    videoId: id,
    title: v.snippet?.title ?? "Track",
    thumbnailUrl: v.snippet?.thumbnails?.high?.url ?? getVideoThumbnail(id),
    channelName: v.snippet?.channelTitle ?? "Artist",
    channelId: v.snippet?.channelId ?? null,
    channelUrl: v.snippet?.channelId ? `https://www.youtube.com/channel/${v.snippet.channelId}` : null,
    publishedAt: v.snippet?.publishedAt ?? null,
    description: v.snippet?.description ?? null,
    durationSeconds: parseIsoDuration(v.contentDetails?.duration),
    embeddable: v.status?.embeddable !== false && v.status?.privacyStatus !== "private",
    url: youtubeWatchUrl(id),
    viewCount: v.statistics?.viewCount ? Number(v.statistics.viewCount) : null,
    likeCount: v.statistics?.likeCount ? Number(v.statistics.likeCount) : null,
    source: "youtube",
  };
}

async function dataApiVideos(ids: string[]): Promise<DataVideo[]> {
  const key = apiKey();
  if (!key || ids.length === 0) return [];
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${ids.slice(0, 40).join(",")}&key=${key}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = (await res.json()) as { items?: DataVideo[] };
    return json.items ?? [];
  } catch {
    return [];
  }
}

export type YtSearchOpts = {
  regionCode?: string;
  maxResults?: number;
  musicOnly?: boolean;
  order?: "relevance" | "viewCount" | "date";
};

export type YtSearchResult = {
  videos: YouTubeVideo[];
  api: "youtube-data-api-v3" | "none";
  keyConfigured: boolean;
  rapidConfigured: boolean;
  error?: string;
  httpStatus?: number;
};

async function googleDataApiSearch(q: string, opts: YtSearchOpts = {}): Promise<YtSearchResult> {
  const needle = q.trim();
  const key = apiKey();
  if (!key) {
    return {
      videos: [],
      api: "none",
      keyConfigured: false,
      rapidConfigured: false,
      error: "YOUTUBE_API_KEY is not set",
    };
  }

  const maxResults = String(Math.min(50, Math.max(8, opts.maxResults ?? 24)));
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults,
    q: needle,
    key,
    order: opts.order ?? "relevance",
    safeSearch: "moderate",
  });
  if (opts.regionCode) params.set("regionCode", opts.regionCode);
  if (opts.musicOnly === true) params.set("videoCategoryId", "10");

  let res: Response;
  try {
    res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, {
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    return {
      videos: [],
      api: "youtube-data-api-v3",
      keyConfigured: true,
      rapidConfigured: false,
      error: e instanceof Error ? e.message : "search.list network error",
    };
  }

  if (!res.ok) {
    let detail = `search.list HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body.error?.message) detail = body.error.message;
    } catch {
      /* ignore */
    }
    return {
      videos: [],
      api: "youtube-data-api-v3",
      keyConfigured: true,
      rapidConfigured: false,
      error: detail,
      httpStatus: res.status,
    };
  }

  const json = (await res.json()) as {
    items?: Array<{ id?: { videoId?: string }; snippet?: DataVideo["snippet"] }>;
  };
  const items = json.items ?? [];
  const ids = items.map((i) => i.id?.videoId).filter(Boolean) as string[];
  const details = await dataApiVideos(ids);
  if (details.length) {
    return {
      videos: details.map(mapDataVideo),
      api: "youtube-data-api-v3",
      keyConfigured: true,
      rapidConfigured: false,
    };
  }

  const quick = items
    .map((i) => {
      const id = i.id?.videoId;
      if (!id) return null;
      return {
        videoId: id,
        title: i.snippet?.title ?? "Track",
        thumbnailUrl: i.snippet?.thumbnails?.high?.url ?? getVideoThumbnail(id),
        channelName: i.snippet?.channelTitle ?? "Artist",
        channelId: i.snippet?.channelId ?? null,
        channelUrl: i.snippet?.channelId
          ? `https://www.youtube.com/channel/${i.snippet.channelId}`
          : null,
        publishedAt: i.snippet?.publishedAt ?? null,
        description: i.snippet?.description ?? null,
        durationSeconds: null,
        embeddable: true,
        url: youtubeWatchUrl(id),
        viewCount: null,
        likeCount: null,
        source: "youtube" as const,
      };
    })
    .filter(Boolean) as YouTubeVideo[];

  return {
    videos: quick,
    api: "youtube-data-api-v3",
    keyConfigured: true,
    rapidConfigured: false,
  };
}

/** Official YouTube Data API v3 only (no scrapers / third-party download APIs). */
export async function searchMusicDetailed(q: string, opts: YtSearchOpts = {}): Promise<YtSearchResult> {
  const needle = q.trim();
  if (!needle) {
    return {
      videos: [],
      api: "none",
      keyConfigured: Boolean(apiKey()),
      rapidConfigured: false,
    };
  }

  const directId = extractVideoId(needle);
  if (directId) {
    const items = await dataApiVideos([directId]);
    if (items[0]) {
      return {
        videos: [mapDataVideo(items[0])],
        api: "youtube-data-api-v3",
        keyConfigured: true,
        rapidConfigured: false,
      };
    }
  }

  return googleDataApiSearch(needle, opts);
}

export async function searchMusic(q: string, opts?: YtSearchOpts): Promise<YouTubeVideo[]> {
  const result = await searchMusicDetailed(q, opts);
  return result.videos;
}

export async function searchVideos(q: string, opts?: YtSearchOpts): Promise<YouTubeVideo[]> {
  return searchMusic(q, opts);
}

/** More tracks from the same artist/channel (used by promotions + player). */
export async function moreFromArtist(opts: {
  channelName: string;
  channelId?: string | null;
  videoId?: string | null;
}): Promise<YouTubeVideo[]> {
  const name = (opts.channelName || "").trim();
  if (!name && !opts.channelId) return [];
  const q = name || String(opts.channelId);
  const list = await searchMusic(`${q} official audio`, { maxResults: 16 });
  return list
    .filter((v) => {
      if (opts.videoId && v.videoId === opts.videoId) return false;
      if (opts.channelId && v.channelId && v.channelId !== opts.channelId) return false;
      if (name && v.channelName) {
        const a = v.channelName.toLowerCase();
        const b = name.toLowerCase();
        if (!a.includes(b) && !b.includes(a)) return false;
      }
      return true;
    })
    .slice(0, 12);
}

export async function getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
  const items = await dataApiVideos([videoId]);
  return items[0] ? mapDataVideo(items[0]) : null;
}

export async function getPublicVideoStats(videoId: string) {
  const d = await getVideoDetails(videoId);
  return { viewCount: d?.viewCount ?? null, likeCount: d?.likeCount ?? null, official: Boolean(d) };
}

export async function validateYouTubeUrl(input: string) {
  const id = extractVideoId(input);
  if (!id) return { ok: false, reason: "Invalid link" };
  const video = await getVideoDetails(id);
  if (!video) return { ok: false, reason: "Not found" };
  return { ok: true, video };
}

export async function getChannelDetails(channelId: string) {
  const key = apiKey();
  if (!key) {
    return {
      channelId,
      channelName: channelId,
      channelUrl: `https://www.youtube.com/channel/${channelId}`,
      avatarUrl: null as string | null,
      subscriberCount: null as number | null,
    };
  }
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${key}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      items?: Array<{
        id: string;
        snippet?: { title?: string; thumbnails?: { default?: { url?: string } } };
        statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
      }>;
    };
    const item = json.items?.[0];
    if (!item) return null;
    return {
      channelId: item.id,
      channelName: item.snippet?.title ?? channelId,
      channelUrl: `https://www.youtube.com/channel/${item.id}`,
      avatarUrl: item.snippet?.thumbnails?.default?.url ?? null,
      subscriberCount: item.statistics?.hiddenSubscriberCount
        ? null
        : Number(item.statistics?.subscriberCount ?? 0) || null,
    };
  } catch {
    return null;
  }
}

export async function searchArtists(q: string) {
  return searchMusic(`${q} official`);
}

export async function getRelatedVideos(videoId: string) {
  const d = await getVideoDetails(videoId);
  if (d?.title) return (await searchMusic(d.title)).filter((v) => v.videoId !== videoId).slice(0, 8);
  return [];
}

export async function getPlaylistDetails(_playlistId: string) {
  return null;
}

/** Metadata helper only — never exposes a downloadable YouTube audio URL. */
export function youtubeVideoToTrack(v: YouTubeVideo): TrackCard {
  const slug =
    v.channelName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "artist";
  return {
    id: `yt_${v.videoId}`,
    title: v.title,
    coverUrl: v.thumbnailUrl,
    audioUrl: "",
    durationMs: (v.durationSeconds ?? 0) * 1000,
    genre: "Music",
    distribution: "youtube",
    priceCents: 0,
    currency: "USD",
    playCount: v.viewCount ?? 0,
    likeCount: v.likeCount ?? 0,
    albumId: null,
    albumTitle: null,
    lyrics: null,
    explicit: false,
    featuredArtists: null,
    producer: null,
    songwriter: null,
    copyrightOwner: null,
    country: null,
    artistId: v.channelId ?? slug,
    artistName: v.channelName,
    artistSlug: slug,
    artistAvatar: v.thumbnailUrl,
    verified: false,
  };
}

export const LOCAL_YOUTUBE_CATALOG: YouTubeVideo[] = [];

export const YouTubeService = {
  extractVideoId,
  getVideoThumbnail,
  validateYouTubeUrl,
  getVideoDetails,
  getPublicVideoStats,
  getChannelDetails,
  searchVideos,
  searchMusic,
  searchMusicDetailed,
  searchArtists,
  getRelatedVideos,
  getPlaylistDetails,
  moreFromArtist,
  youtubeWatchUrl,
  youtubeEmbedUrl,
  youtubeVideoToTrack,
  youtubeApiKey,
};
