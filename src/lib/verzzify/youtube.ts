import type { YouTubeVideo } from "./types";
import { ALL_YT_VIDEOS, searchLocalYoutube } from "./yt-charts";

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
  if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && YT_ID.test(id) ? id : null;
    }
    const v = url.searchParams.get("v");
    if (v && YT_ID.test(v)) return v;
    const parts = url.pathname.split("/").filter(Boolean);
    const nested = parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live" || parts[0] === "v";
    if (nested && parts[1] && YT_ID.test(parts[1])) return parts[1];
  }
  return null;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeEmbedUrl(videoId: string, autoplay = false): string {
  const q = new URLSearchParams({ rel: "0", modestbranding: "1" });
  if (autoplay) q.set("autoplay", "1");
  return `https://www.youtube-nocookie.com/embed/${videoId}?${q.toString()}`;
}

export function getVideoThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

type OEmbed = {
  title?: string;
  author_name?: string;
  author_url?: string;
  thumbnail_url?: string;
};

function apiKey(): string | undefined {
  const k = process.env.YOUTUBE_API_KEY?.trim();
  return k || undefined;
}

function channelIdFromUrl(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/channel\/([A-Za-z0-9_-]+)/);
  return m?.[1] ?? null;
}

function parseIsoDuration(iso?: string): number | null {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  return (Number(m[1] || 0) * 3600) + (Number(m[2] || 0) * 60) + Number(m[3] || 0);
}

async function oEmbed(url: string): Promise<OEmbed | null> {
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(endpoint, { headers: { accept: "application/json" } });
  if (!res.ok) return null;
  return (await res.json()) as OEmbed;
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

async function dataApiVideos(ids: string[]): Promise<DataVideo[]> {
  const key = apiKey();
  if (!key || ids.length === 0) return [];
  const url =
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${ids.join(",")}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: DataVideo[] };
  return json.items ?? [];
}

function mapDataVideo(v: DataVideo): YouTubeVideo {
  const id = v.id;
  return {
    videoId: id,
    title: v.snippet?.title ?? "YouTube video",
    thumbnailUrl: v.snippet?.thumbnails?.high?.url ?? getVideoThumbnail(id),
    channelName: v.snippet?.channelTitle ?? "YouTube",
    channelId: v.snippet?.channelId ?? null,
    channelUrl: v.snippet?.channelId
      ? `https://www.youtube.com/channel/${v.snippet.channelId}`
      : null,
    publishedAt: v.snippet?.publishedAt ?? null,
    description: v.snippet?.description ?? null,
    durationSeconds: parseIsoDuration(v.contentDetails?.duration),
    embeddable: v.status?.embeddable !== false && v.status?.privacyStatus === "public",
    url: youtubeWatchUrl(id),
    viewCount: v.statistics?.viewCount ? Number(v.statistics.viewCount) : null,
    likeCount: v.statistics?.likeCount ? Number(v.statistics.likeCount) : null,
    source: "youtube",
  };
}

export async function getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
  const items = await dataApiVideos([videoId]);
  if (items[0]) return mapDataVideo(items[0]);
  const url = youtubeWatchUrl(videoId);
  const meta = await oEmbed(url);
  if (!meta) return null;
  return {
    videoId,
    title: meta.title ?? "YouTube video",
    thumbnailUrl: meta.thumbnail_url ?? getVideoThumbnail(videoId),
    channelName: meta.author_name ?? "YouTube",
    channelId: channelIdFromUrl(meta.author_url),
    channelUrl: meta.author_url ?? null,
    publishedAt: null,
    description: null,
    durationSeconds: null,
    embeddable: true,
    url,
    viewCount: null,
    likeCount: null,
    source: "youtube",
  };
}

export async function getPublicVideoStats(videoId: string): Promise<{
  viewCount: number | null;
  likeCount: number | null;
  official: boolean;
}> {
  const items = await dataApiVideos([videoId]);
  if (!items[0]?.statistics) return { viewCount: null, likeCount: null, official: false };
  return {
    viewCount: items[0].statistics.viewCount ? Number(items[0].statistics.viewCount) : null,
    likeCount: items[0].statistics.likeCount ? Number(items[0].statistics.likeCount) : null,
    official: true,
  };
}

export async function validateYouTubeUrl(input: string): Promise<{
  ok: boolean;
  reason?: string;
  video?: YouTubeVideo;
}> {
  const id = extractVideoId(input);
  if (!id) return { ok: false, reason: "That does not look like a YouTube video URL." };
  const video = await getVideoDetails(id);
  if (!video) return { ok: false, reason: "YouTube could not find a public video at that link." };
  if (!video.embeddable) {
    return {
      ok: true,
      video: { ...video, embeddable: false },
      reason: "The video is public. Embedding may be restricted — play will open YouTube.",
    };
  }
  return { ok: true, video };
}

export async function getChannelDetails(channelId: string): Promise<{
  channelId: string;
  channelName: string;
  channelUrl: string;
  avatarUrl: string | null;
  subscriberCount: number | null;
} | null> {
  const key = apiKey();
  if (!key) {
    return {
      channelId,
      channelName: channelId,
      channelUrl: `https://www.youtube.com/channel/${channelId}`,
      avatarUrl: null,
      subscriberCount: null,
    };
  }
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${key}`;
  const res = await fetch(url);
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
  const hidden = item.statistics?.hiddenSubscriberCount;
  return {
    channelId: item.id,
    channelName: item.snippet?.title ?? channelId,
    channelUrl: `https://www.youtube.com/channel/${item.id}`,
    avatarUrl: item.snippet?.thumbnails?.default?.url ?? null,
    subscriberCount: hidden ? null : Number(item.statistics?.subscriberCount ?? 0) || null,
  };
}

export const LOCAL_YOUTUBE_CATALOG: YouTubeVideo[] = [
  {
    videoId: "GIDiI5kyBDQ",
    title: "Black Sherif - Kwaku the Traveller (Official Video)",
    thumbnailUrl: getVideoThumbnail("GIDiI5kyBDQ"),
    channelName: "Black Sherif Music",
    channelId: "UCKfrbVDBEq-wcYC4rUzEosA",
    channelUrl: "https://www.youtube.com/channel/UCKfrbVDBEq-wcYC4rUzEosA",
    publishedAt: "2022-05-19",
    description: "Official video.",
    durationSeconds: 213,
    embeddable: true,
    url: youtubeWatchUrl("GIDiI5kyBDQ"),
    viewCount: null,
    likeCount: null,
    source: "youtube",
  },
  {
    videoId: "NPCC02SaJVg",
    title: "King Promise - Terminator feat. Young Jonn (Official Video)",
    thumbnailUrl: getVideoThumbnail("NPCC02SaJVg"),
    channelName: "King Promise Official",
    channelId: "UCHhS8FHRTxM7ysMKRUl3LHQ",
    channelUrl: "https://www.youtube.com/channel/UCHhS8FHRTxM7ysMKRUl3LHQ",
    publishedAt: "2023-07-17",
    description: "Official video.",
    durationSeconds: 244,
    embeddable: true,
    url: youtubeWatchUrl("NPCC02SaJVg"),
    viewCount: null,
    likeCount: null,
    source: "youtube",
  },
  {
    videoId: "421w1j87fEM",
    title: "Burna Boy - Last Last [Official Music Video]",
    thumbnailUrl: getVideoThumbnail("421w1j87fEM"),
    channelName: "Burna Boy",
    channelId: "UCEzDdNqNkT-7rSfSGSr1hWg",
    channelUrl: "https://www.youtube.com/channel/UCEzDdNqNkT-7rSfSGSr1hWg",
    publishedAt: "2022-05-12",
    description: "Official video.",
    durationSeconds: 174,
    embeddable: true,
    url: youtubeWatchUrl("421w1j87fEM"),
    viewCount: null,
    likeCount: null,
    source: "youtube",
  },
  {
    videoId: "WvxADzZMkEI",
    title: "Uncle Waffles and Tony Duardo - Tanzania (Official Music Video)",
    thumbnailUrl: getVideoThumbnail("WvxADzZMkEI"),
    channelName: "Uncle Waffles",
    channelId: "UCDfH7E8iHkEjmZ6H9uQ5o1g",
    channelUrl: "https://www.youtube.com/channel/UCDfH7E8iHkEjmZ6H9uQ5o1g",
    publishedAt: "2022-09-28",
    description: "Official video.",
    durationSeconds: 236,
    embeddable: true,
    url: youtubeWatchUrl("WvxADzZMkEI"),
    viewCount: null,
    likeCount: null,
    source: "youtube",
  },
  {
    videoId: "tQiNQL-FEgU",
    title: "Free Mind",
    thumbnailUrl: getVideoThumbnail("tQiNQL-FEgU"),
    channelName: "Tems",
    channelId: "UCXg6YtKpgC59gRKUfxQw8Fw",
    channelUrl: "https://www.youtube.com/channel/UCXg6YtKpgC59gRKUfxQw8Fw",
    publishedAt: "2020-09-24",
    description: "Official audio on YouTube.",
    durationSeconds: 248,
    embeddable: true,
    url: youtubeWatchUrl("tQiNQL-FEgU"),
    viewCount: null,
    likeCount: null,
    source: "youtube",
  },
];

function localSearch(q: string): YouTubeVideo[] {
  const n = q.trim().toLowerCase();
  if (!n) return [];
  const local = searchLocalYoutube(n);
  if (local.length) return local;
  return ALL_YT_VIDEOS.filter(
    (v) =>
      v.title.toLowerCase().includes(n) ||
      v.channelName.toLowerCase().includes(n) ||
      (v.description ?? "").toLowerCase().includes(n),
  );
}

async function dataApiSearch(q: string, extra = ""): Promise<YouTubeVideo[]> {
  const key = apiKey();
  if (!key) return localSearch(q);
  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&q=${encodeURIComponent(q)}${extra}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return localSearch(q);
  const json = (await res.json()) as {
    items?: Array<{ id?: { videoId?: string }; snippet?: DataVideo["snippet"] }>;
  };
  const ids = (json.items ?? []).map((i) => i.id?.videoId).filter(Boolean) as string[];
  const details = await dataApiVideos(ids);
  if (details.length) return details.map(mapDataVideo);
  return (json.items ?? [])
    .map((i) => {
      const id = i.id?.videoId;
      if (!id) return null;
      return {
        videoId: id,
        title: i.snippet?.title ?? "YouTube video",
        thumbnailUrl: i.snippet?.thumbnails?.high?.url ?? getVideoThumbnail(id),
        channelName: i.snippet?.channelTitle ?? "YouTube",
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
}

export async function moreFromArtist(opts: {
  channelName: string;
  channelId?: string | null;
  videoId?: string | null;
}): Promise<YouTubeVideo[]> {
  const exclude = opts.videoId ?? "";
  const name = opts.channelName.trim();
  const local = ALL_YT_VIDEOS.filter((v) => {
    if (v.videoId === exclude) return false;
    if (opts.channelId && v.channelId === opts.channelId) return true;
    return v.channelName.toLowerCase() === name.toLowerCase() || v.channelName.toLowerCase().includes(name.toLowerCase().replace(/vevo$/i, "").trim());
  });
  const extra = opts.channelId ? `&channelId=${encodeURIComponent(opts.channelId)}` : "";
  const q = opts.channelId ? "official audio OR official video OR lyrics" : `${name} official audio`;
  const live = await dataApiSearch(q, `${extra}&videoCategoryId=10`);
  const named = name ? await dataApiSearch(`${name} songs`, "&videoCategoryId=10") : [];
  const seen = new Set<string>();
  const out: YouTubeVideo[] = [];
  for (const v of [...local, ...live, ...named]) {
    if (!v.videoId || v.videoId === exclude || seen.has(v.videoId)) continue;
    seen.add(v.videoId);
    out.push(v);
  }
  return out.slice(0, 16);
}

export async function searchVideos(q: string): Promise<YouTubeVideo[]> {
  return dataApiSearch(q);
}

export async function searchMusic(q: string): Promise<YouTubeVideo[]> {
  return dataApiSearch(q, "&videoCategoryId=10");
}

export async function searchArtists(q: string): Promise<YouTubeVideo[]> {
  return dataApiSearch(`${q} official artist`, "&videoCategoryId=10");
}

export async function getRelatedVideos(videoId: string): Promise<YouTubeVideo[]> {
  const key = apiKey();
  if (!key) {
    return LOCAL_YOUTUBE_CATALOG.filter((v) => v.videoId !== videoId).slice(0, 4);
  }
  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&relatedToVideoId=${videoId}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return LOCAL_YOUTUBE_CATALOG.filter((v) => v.videoId !== videoId).slice(0, 4);
  return searchVideos(videoId);
}

export async function getPlaylistDetails(playlistId: string): Promise<{
  id: string;
  title: string;
  videos: YouTubeVideo[];
} | null> {
  const key = apiKey();
  if (!key) return null;
  const url =
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=8&playlistId=${playlistId}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as {
    items?: Array<{ snippet?: { title?: string; resourceId?: { videoId?: string } } }>;
  };
  const ids = (json.items ?? [])
    .map((i) => i.snippet?.resourceId?.videoId)
    .filter(Boolean) as string[];
  const videos = await dataApiVideos(ids);
  return { id: playlistId, title: "YouTube playlist", videos: videos.map(mapDataVideo) };
}

export const YouTubeService = {
  extractVideoId,
  getVideoThumbnail,
  validateYouTubeUrl,
  getVideoDetails,
  getPublicVideoStats,
  getChannelDetails,
  searchVideos,
  searchMusic,
  searchArtists,
  getRelatedVideos,
  getPlaylistDetails,
  youtubeWatchUrl,
  youtubeEmbedUrl,
};
