import { rapidKey, rapidSearch } from "./rapid-yt";
import type { TrackCard, YouTubeVideo } from "./types";
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
  const q = new URLSearchParams({ rel: "0", modestbranding: "1" });
  if (autoplay) q.set("autoplay", "1");
  return `https://www.youtube-nocookie.com/embed/${videoId}?${q.toString()}`;
}

export function getVideoThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function apiKey(): string | undefined {
  const k = process.env.YOUTUBE_API_KEY?.trim();
  return k || undefined;
}

export async function searchMusic(q: string, opts?: { regionCode?: string; maxResults?: number }): Promise<YouTubeVideo[]> {
  const region = opts?.regionCode;
  const max = opts?.maxResults ?? 36;
  const needle = q.trim();
  if (!needle) return [];
  const key = apiKey();
  if (!key) return [];
  try {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      maxResults: String(Math.min(24, max)),
      q: needle,
      key,
      order: "relevance",
      safeSearch: "none",
    });
    if (region) params.set("regionCode", region);
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          channelTitle?: string;
          channelId?: string;
          publishedAt?: string;
          description?: string;
          thumbnails?: { high?: { url?: string } };
        };
      }>;
    };
    return (json.items ?? [])
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
  } catch {
    return [];
  }
}

export async function searchVideos(q: string, opts?: { regionCode?: string; maxResults?: number }) {
  return searchMusic(q, opts);
}

export async function getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
  const key = apiKey();
  if (!key) return null;
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${videoId}&key=${key}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { items?: any[] };
    const v = json.items?.[0];
    if (!v) return null;
    return {
      videoId: v.id,
      title: v.snippet?.title ?? "Track",
      thumbnailUrl: v.snippet?.thumbnails?.high?.url ?? getVideoThumbnail(v.id),
      channelName: v.snippet?.channelTitle ?? "Artist",
      channelId: v.snippet?.channelId ?? null,
      channelUrl: v.snippet?.channelId ? `https://www.youtube.com/channel/${v.snippet.channelId}` : null,
      publishedAt: v.snippet?.publishedAt ?? null,
      description: v.snippet?.description ?? null,
      durationSeconds: null,
      embeddable: true,
      url: youtubeWatchUrl(v.id),
      viewCount: v.statistics?.viewCount ? Number(v.statistics.viewCount) : null,
      likeCount: v.statistics?.likeCount ? Number(v.statistics.likeCount) : null,
      source: "youtube",
    };
  } catch {
    return null;
  }
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
  return {
    channelId,
    channelName: channelId,
    channelUrl: `https://www.youtube.com/channel/${channelId}`,
    avatarUrl: null,
    subscriberCount: null,
  };
}

export async function searchArtists(q: string) {
  return searchMusic(`${q} official`);
}

export async function getRelatedVideos(videoId: string) {
  const d = await getVideoDetails(videoId);
  if (d?.title) return (await searchMusic(d.title)).filter((v) => v.videoId !== videoId).slice(0, 8);
  return [];
}

export async function getPlaylistDetails(playlistId: string) {
  return null;
}

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
    audioUrl: `/api/v1/yt-mp3?videoId=${encodeURIComponent(v.videoId)}`,
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
  searchArtists,
  getRelatedVideos,
  getPlaylistDetails,
  youtubeWatchUrl,
  youtubeEmbedUrl,
  youtubeVideoToTrack,
};
