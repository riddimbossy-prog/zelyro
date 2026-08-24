import type { YouTubeVideo } from "./types";

const HOST = process.env.RAPIDAPI_YT_HOST?.trim() || "yt-search-and-download-mp3.p.rapidapi.com";
const YT_ID = /^[a-zA-Z0-9_-]{11}$/;

function extractId(input: string): string | null {
  const raw = input.trim();
  if (YT_ID.test(raw)) return raw;
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && YT_ID.test(id) ? id : null;
    }
    const v = url.searchParams.get("v");
    if (v && YT_ID.test(v)) return v;
  } catch {
    return null;
  }
  return null;
}

export function rapidKey(): string | undefined {
  return process.env.RAPIDAPI_KEY?.trim() || process.env.X_RAPIDAPI_KEY?.trim() || undefined;
}

function headers(): HeadersInit {
  const key = rapidKey();
  if (!key) throw new Error("RAPIDAPI_KEY is not set");
  return {
    "x-rapidapi-key": key,
    "x-rapidapi-host": HOST,
  };
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function walkUrls(node: unknown, out: string[] = []): string[] {
  if (typeof node === "string" && /^https?:\/\//i.test(node)) out.push(node);
  else if (Array.isArray(node)) node.forEach((n) => walkUrls(n, out));
  else {
    const rec = asRecord(node);
    if (rec) Object.values(rec).forEach((n) => walkUrls(n, out));
  }
  return out;
}

function walkList(node: unknown): unknown[] {
  if (Array.isArray(node)) return node;
  const rec = asRecord(node);
  if (!rec) return [];
  for (const k of ["result", "results", "data", "videos", "items", "list"]) {
    if (Array.isArray(rec[k])) return rec[k] as unknown[];
  }
  return [];
}

function str(rec: Record<string, unknown> | null, ...keys: string[]): string {
  if (!rec) return "";
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export type RapidMp3 = {
  title: string;
  thumbnail: string;
  url: string;
};

export async function rapidMp3(watchUrl: string): Promise<RapidMp3> {
  const attempts = [
    `https://${HOST}/mp3?url=${encodeURIComponent(watchUrl)}`,
    `https://${HOST}/mp3?id=${encodeURIComponent(extractId(watchUrl) ?? watchUrl)}`,
  ];
  let last = "RapidAPI /mp3 failed";
  for (const href of attempts) {
    const res = await fetch(href, { headers: headers() });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      last = text.slice(0, 180);
      continue;
    }
    const rec = asRecord(json);
    const nested = asRecord(rec?.result) ?? asRecord(rec?.data) ?? rec;
    const urls = walkUrls(json);
    const audio =
      urls.find((u) => /\.mp3(\?|$)/i.test(u) || /audio/i.test(u)) ??
      str(nested, "url", "link", "download", "mp3", "audio", "src") ??
      urls[0];
    if (res.ok && audio && /^https?:\/\//i.test(audio)) {
      const id = extractId(watchUrl);
      return {
        title: str(nested, "title", "name") || "YouTube audio",
        thumbnail: str(nested, "thumbnail", "thumb", "image") || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : ""),
        url: audio,
      };
    }
    last = str(rec, "message", "error", "msg") || text.slice(0, 180);
  }
  throw new Error(last);
}

export async function rapidSearch(q: string, limit = 20): Promise<YouTubeVideo[]> {
  if (!rapidKey() || !q.trim()) return [];
  const url = `https://${HOST}/search?q=${encodeURIComponent(q.trim())}&limit=${Math.min(50, Math.max(1, limit))}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) return [];
  const json = (await res.json()) as unknown;
  const out: YouTubeVideo[] = [];
  const seen = new Set<string>();
  for (const item of walkList(json)) {
    const rec = asRecord(item);
    const href = str(rec, "url", "link", "video_url", "videoUrl", "webpage_url");
    const id = extractId(str(rec, "videoId", "video_id", "id", "v") || href) ?? extractId(href);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      videoId: id,
      title: str(rec, "title", "name") || "YouTube video",
      thumbnailUrl: str(rec, "thumbnail", "thumb", "image", "thumbnailUrl") || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      channelName: str(rec, "channel", "channelName", "author", "uploader", "artist") || "YouTube",
      channelId: str(rec, "channelId", "channel_id") || null,
      channelUrl: null,
      publishedAt: str(rec, "publishedAt", "upload_date") || null,
      description: str(rec, "description") || null,
      durationSeconds: Number(rec?.duration ?? rec?.durationSeconds ?? rec?.length) || null,
      embeddable: true,
      url: `https://www.youtube.com/watch?v=${id}`,
      viewCount: Number(rec?.views ?? rec?.viewCount ?? rec?.view_count) || null,
      likeCount: null,
      source: "youtube",
    });
  }
  return out;
}
