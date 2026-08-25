import type { YouTubeVideo } from "./types";

/** Search API host */
const SEARCH_HOST =
  process.env.RAPIDAPI_YT_HOST?.trim() || "youtube-search-download3.p.rapidapi.com";

/**
 * MP3 / download host.
 * Prefer same host as search when using youtube-search-download3.
 */
const MP3_HOST =
  process.env.RAPIDAPI_MP3_HOST?.trim() ||
  process.env.RAPIDAPI_DOWNLOAD_HOST?.trim() ||
  process.env.RAPIDAPI_YT_HOST?.trim() ||
  "youtube-search-download3.p.rapidapi.com";

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

export function rapidMp3Host(): string {
  return MP3_HOST;
}

function headersFor(host: string): HeadersInit {
  const key = rapidKey();
  if (!key) throw new Error("RAPIDAPI_KEY is not set");
  return {
    "x-rapidapi-key": key,
    "x-rapidapi-host": host,
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
  for (const k of ["items", "result", "results", "data", "videos", "list", "contents"]) {
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

function pickAudioUrl(json: unknown): string | null {
  const rec = asRecord(json);
  const nested =
    asRecord(rec?.result) ??
    asRecord(rec?.data) ??
    asRecord(rec?.download) ??
    asRecord(rec?.link) ??
    rec;
  const urls = walkUrls(json);

  // Prefer explicit audio fields
  const named =
    str(nested, "mp3", "audio", "audioUrl", "audio_url", "downloadUrl", "download_url", "link", "url", "file") ||
    str(rec, "mp3", "audio", "downloadUrl", "link", "url");
  if (named && /^https?:\/\//i.test(named)) return named;

  const audioish = urls.find(
    (u) =>
      /\.mp3(\?|$)/i.test(u) ||
      /mime=audio/i.test(u) ||
      /audio/i.test(u) ||
      /googlevideo\.com/i.test(u),
  );
  if (audioish) return audioish;

  // Some APIs return { formats: [{ url, mimeType }] }
  const formats = Array.isArray(rec?.formats)
    ? (rec!.formats as unknown[])
    : Array.isArray(nested?.formats)
      ? (nested!.formats as unknown[])
      : [];
  for (const f of formats) {
    const fr = asRecord(f);
    const mime = str(fr, "mimeType", "mime", "type", "ext").toLowerCase();
    const u = str(fr, "url", "link", "download");
    if (u && (/audio|mp3|m4a/.test(mime) || /\.mp3/i.test(u))) return u;
  }

  return urls[0] && /^https?:\/\//i.test(urls[0]) ? urls[0] : null;
}

function thumbFromSnippet(snippet: Record<string, unknown> | null, id: string): string {
  const thumbs = asRecord(snippet?.thumbnails);
  const high = asRecord(thumbs?.high);
  const medium = asRecord(thumbs?.medium);
  const def = asRecord(thumbs?.default);
  return (
    str(high, "url") ||
    str(medium, "url") ||
    str(def, "url") ||
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  );
}

function mapV3Item(item: unknown): YouTubeVideo | null {
  const rec = asRecord(item);
  if (!rec) return null;
  const idObj = asRecord(rec.id);
  const snippet = asRecord(rec.snippet);
  const id =
    extractId(str(idObj, "videoId") || str(rec, "videoId", "video_id", "id", "video")) ||
    extractId(str(rec, "url", "link"));
  if (!id) return null;
  return {
    videoId: id,
    title: str(snippet, "title") || str(rec, "title", "name") || "Track",
    thumbnailUrl:
      thumbFromSnippet(snippet, id) ||
      str(rec, "thumbnail", "thumbnailUrl", "thumb") ||
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    channelName:
      str(snippet, "channelTitle") ||
      str(rec, "channel", "channelName", "author", "uploader", "artist") ||
      "Artist",
    channelId: str(snippet, "channelId") || str(rec, "channelId", "channel_id") || null,
    channelUrl: (() => {
      const cid = str(snippet, "channelId") || str(rec, "channelId");
      return cid ? `https://www.youtube.com/channel/${cid}` : null;
    })(),
    publishedAt: str(snippet, "publishedAt") || str(rec, "publishedAt", "upload_date") || null,
    description: str(snippet, "description") || str(rec, "description") || null,
    durationSeconds: Number(rec.duration ?? rec.durationSeconds ?? rec.length) || null,
    embeddable: true,
    url: `https://www.youtube.com/watch?v=${id}`,
    viewCount: Number(rec.views ?? rec.viewCount ?? rec.view_count) || null,
    likeCount: null,
    source: "youtube",
  };
}

export type RapidMp3 = {
  title: string;
  thumbnail: string;
  url: string;
};

async function tryMp3Url(href: string, host: string, videoId: string): Promise<RapidMp3 | null> {
  const res = await fetch(href, {
    headers: headersFor(host),
    signal: AbortSignal.timeout(8000),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  const audio = pickAudioUrl(json);
  if (!res.ok || !audio) return null;
  const rec = asRecord(json);
  const nested = asRecord(rec?.result) ?? asRecord(rec?.data) ?? rec;
  return {
    title: str(nested, "title", "name") || "Track",
    thumbnail:
      str(nested, "thumbnail", "thumb", "image") ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    url: audio,
  };
}

/** Resolve an MP3 stream URL for offline download / audio playback. */
export async function rapidMp3(watchUrl: string): Promise<RapidMp3> {
  if (!rapidKey()) throw new Error("RAPIDAPI_KEY is not set");

  const id = extractId(watchUrl) ?? watchUrl;
  const host = MP3_HOST;

  if (host.includes("youtube-v311")) {
    throw new Error(
      "RAPIDAPI_MP3_HOST is search-only (youtube-v311). Set it to youtube-search-download3.p.rapidapi.com",
    );
  }

  // Endpoint shapes for common RapidAPI products (boztek first)
  const attempts = [
    `https://${host}/download?video=${encodeURIComponent(id)}`,
    `https://${host}/download?id=${encodeURIComponent(id)}`,
    `https://${host}/download?url=${encodeURIComponent(watchUrl)}`,
    `https://${host}/mp3?id=${encodeURIComponent(id)}`,
    `https://${host}/mp3?url=${encodeURIComponent(watchUrl)}`,
    `https://${host}/dl?id=${encodeURIComponent(id)}`,
    `https://${host}/get_mp3_download_link/${encodeURIComponent(id)}`,
    `https://${host}/get-mp3-download-link/${encodeURIComponent(id)}`,
  ];

  const firstBatch = await Promise.allSettled(
    attempts.slice(0, 3).map((href) => tryMp3Url(href, host, id)),
  );
  for (const r of firstBatch) {
    if (r.status === "fulfilled" && r.value) return r.value;
  }

  for (const href of attempts.slice(3)) {
    try {
      const hit = await tryMp3Url(href, host, id);
      if (hit) return hit;
    } catch {
      /* continue */
    }
  }

  throw new Error(
    `MP3 unavailable from ${host}. Subscribe to that API and set RAPIDAPI_MP3_HOST to its x-rapidapi-host.`,
  );
}

/** Search via RapidAPI */
export async function rapidSearch(
  q: string,
  limit = 20,
  regionCode?: string,
): Promise<YouTubeVideo[]> {
  if (!rapidKey() || !q.trim()) return [];

  const max = Math.min(50, Math.max(1, limit));
  const host = SEARCH_HOST;
  const isGlavier = host.includes("youtube-v311");
  const isBoztek = host.includes("youtube-search-download3") || host.includes("search-download");

  const urls: string[] = [];
  if (isGlavier) {
    const p = new URLSearchParams({
      part: "snippet",
      type: "video",
      maxResults: String(max),
      q: q.trim(),
      order: "relevance",
      safeSearch: "none",
    });
    if (regionCode) p.set("regionCode", regionCode);
    urls.push(`https://${host}/search/?${p.toString()}`);
    urls.push(`https://${host}/search?${p.toString()}`);
  } else if (isBoztek) {
    urls.push(`https://${host}/search?query=${encodeURIComponent(q.trim())}`);
    urls.push(`https://${host}/search?q=${encodeURIComponent(q.trim())}`);
  } else {
    urls.push(`https://${host}/search?query=${encodeURIComponent(q.trim())}`);
    urls.push(`https://${host}/search?q=${encodeURIComponent(q.trim())}&limit=${max}`);
  }

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: headersFor(host),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as unknown;
      const out: YouTubeVideo[] = [];
      const seen = new Set<string>();

      for (const item of walkList(json)) {
        const mapped = mapV3Item(item);
        if (!mapped || seen.has(mapped.videoId)) continue;
        seen.add(mapped.videoId);
        out.push(mapped);
      }

      if (out.length === 0) {
        for (const item of walkList(json)) {
          const rec = asRecord(item);
          const href = str(rec, "url", "link", "video_url", "videoUrl", "webpage_url");
          const id =
            extractId(str(rec, "videoId", "video_id", "id", "v", "video") || href) ??
            extractId(href);
          if (!id || seen.has(id)) continue;
          seen.add(id);
          out.push({
            videoId: id,
            title: str(rec, "title", "name") || "Track",
            thumbnailUrl:
              str(rec, "thumbnail", "thumb", "image", "thumbnailUrl") ||
              `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            channelName:
              str(rec, "channel", "channelName", "author", "uploader", "artist") || "Artist",
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
      }

      if (out.length) return out.slice(0, max);
    } catch {
      /* try next */
    }
  }

  return [];
}
