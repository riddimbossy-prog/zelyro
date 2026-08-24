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
  return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
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
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${ids.join(",")}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: DataVideo[] };
  return json.items ?? [];
}

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
    title: meta.title ?? "Track",
    thumbnailUrl: meta.thumbnail_url ?? getVideoThumbnail(videoId),
    channelName: meta.author_name ?? "Artist",
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

export type YtSearchOpts = {
  /** ISO country code for YouTube region bias */
  regionCode?: string;
  /** Limit results (max 50) */
  maxResults?: number;
  /** Restrict to Music category (10) */
  musicOnly?: boolean;
  /** relevance | viewCount | date */
  order?: "relevance" | "viewCount" | "date";
};

function textOf(node: unknown): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node !== "object") return "";
  const rec = node as Record<string, unknown>;
  if (typeof rec.simpleText === "string") return rec.simpleText;
  if (Array.isArray(rec.runs)) {
    return rec.runs.map((r) => (r && typeof r === "object" && "text" in r ? String((r as { text?: string }).text ?? "") : "")).join("");
  }
  return "";
}

function walkVideoRenderers(node: unknown, out: YouTubeVideo[], seen: Set<string>, limit: number) {
  if (!node || out.length >= limit) return;
  if (Array.isArray(node)) {
    for (const n of node) walkVideoRenderers(n, out, seen, limit);
    return;
  }
  if (typeof node !== "object") return;
  const rec = node as Record<string, unknown>;
  const vr = (rec.videoRenderer ?? rec.compactVideoRenderer) as Record<string, unknown> | undefined;
  const id = typeof vr?.videoId === "string" ? vr.videoId : "";
  if (id && YT_ID.test(id) && !seen.has(id)) {
    seen.add(id);
    const owner = vr.ownerText ?? vr.shortBylineText;
    const channelName = textOf(owner) || "Artist";
    let channelId: string | null = null;
    const runs = owner && typeof owner === "object" ? (owner as { runs?: Array<{ navigationEndpoint?: { browseEndpoint?: { browseId?: string } } }> }).runs : undefined;
    channelId = runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ?? null;
    const thumbs = (vr.thumbnail as { thumbnails?: Array<{ url?: string }> } | undefined)?.thumbnails;
    const length = textOf(vr.lengthText);
    const parts = length.split(":").map(Number);
    let durationSeconds: number | null = null;
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2 && parts.every((n) => !Number.isNaN(n))) durationSeconds = parts[0] * 60 + parts[1];
    const viewsRaw = textOf(vr.viewCountText).replace(/[^0-9]/g, "");
    out.push({
      videoId: id,
      title: textOf(vr.title) || "Track",
      thumbnailUrl: thumbs?.[thumbs.length - 1]?.url ?? getVideoThumbnail(id),
      channelName,
      channelId,
      channelUrl: channelId ? `https://www.youtube.com/channel/${channelId}` : null,
      publishedAt: textOf(vr.publishedTimeText) || null,
      description: textOf(vr.descriptionSnippet) || null,
      durationSeconds,
      embeddable: true,
      url: youtubeWatchUrl(id),
      viewCount: viewsRaw ? Number(viewsRaw) : null,
      likeCount: null,
      source: "youtube",
    });
  }
  for (const v of Object.values(rec)) {
    if (out.length >= limit) return;
    walkVideoRenderers(v, out, seen, limit);
  }
}

async function innertubeSearch(q: string, limit = 24): Promise<YouTubeVideo[]> {
  try {
    const res = await fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "*/*",
        "x-youtube-client-name": "1",
        "x-youtube-client-version": "2.20240620.00.00",
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240620.00.00",
            hl: "en",
            gl: "US",
          },
        },
        query: q,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json: unknown = await res.json();
    const out: YouTubeVideo[] = [];
    walkVideoRenderers(json, out, new Set(), limit);
    return out;
  } catch {
    return [];
  }
}

const INVIDIOUS_HOSTS = ["https://inv.nadeko.net", "https://invidious.nerdvpn.de", "https://yt.artemislena.eu"];

async function invidiousSearch(q: string, limit = 24): Promise<YouTubeVideo[]> {
  for (const host of INVIDIOUS_HOSTS) {
    try {
      const res = await fetch(`${host}/api/v1/search?q=${encodeURIComponent(q)}&type=video`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as Array<Record<string, unknown>>;
      if (!Array.isArray(json)) continue;
      const out: YouTubeVideo[] = [];
      const seen = new Set<string>();
      for (const item of json) {
        const id = typeof item.videoId === "string" ? item.videoId : "";
        if (!id || !YT_ID.test(id) || seen.has(id)) continue;
        seen.add(id);
        const author = typeof item.author === "string" ? item.author : "Artist";
        const authorId = typeof item.authorId === "string" ? item.authorId : null;
        out.push({
          videoId: id,
          title: typeof item.title === "string" ? item.title : "Track",
          thumbnailUrl: getVideoThumbnail(id),
          channelName: author,
          channelId: authorId,
          channelUrl: authorId ? `https://www.youtube.com/channel/${authorId}` : null,
          publishedAt: typeof item.publishedText === "string" ? item.publishedText : null,
          description: typeof item.description === "string" ? item.description : null,
          durationSeconds: typeof item.lengthSeconds === "number" ? item.lengthSeconds : null,
          embeddable: true,
          url: youtubeWatchUrl(id),
          viewCount: typeof item.viewCount === "number" ? item.viewCount : null,
          likeCount: null,
          source: "youtube",
        });
        if (out.length >= limit) break;
      }
      if (out.length) return out;
    } catch {
      continue;
    }
  }
  return [];
}

async function dataApiSearch(q: string, opts: YtSearchOpts = {}): Promise<YouTubeVideo[]> {
  const key = apiKey();
  if (!key) return [];

  // Paste a video URL or 11-char id → resolve that video first
  const directId = extractVideoId(q);
  if (directId) {
    const detail = await getVideoDetails(directId);
    return detail ? [detail] : [];
  }

  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: String(Math.min(50, Math.max(8, opts.maxResults ?? 24))),
    q,
    key,
    order: opts.order ?? "relevance",
    safeSearch: "none",
  });
  if (opts.regionCode) params.set("regionCode", opts.regionCode);
  // videoCategoryId=10 (Music) is notoriously empty for artist/song queries — only use when asked.
  if (opts.musicOnly === true) params.set("videoCategoryId", "10");

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!res.ok) return [];
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
    return (
      v.channelName.toLowerCase() === name.toLowerCase() ||
      v.channelName
        .toLowerCase()
        .includes(name.toLowerCase().replace(/vevo$/i, "").trim())
    );
  });
  const live = opts.channelId
    ? await dataApiSearch("official audio OR official video OR lyrics", {
        maxResults: 16,
        musicOnly: true,
      }).then(async (rows) => {
        // channelId filter via second pass when API supports it on search
        const key = apiKey();
        if (!key || !opts.channelId) return rows;
        const params = new URLSearchParams({
          part: "snippet",
          type: "video",
          maxResults: "16",
          q: "official",
          channelId: opts.channelId,
          videoCategoryId: "10",
          key,
        });
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
        if (!res.ok) return rows;
        const json = (await res.json()) as {
          items?: Array<{ id?: { videoId?: string }; snippet?: DataVideo["snippet"] }>;
        };
        const ids = (json.items ?? []).map((i) => i.id?.videoId).filter(Boolean) as string[];
        const details = await dataApiVideos(ids);
        return details.length ? details.map(mapDataVideo) : rows;
      })
    : await dataApiSearch(`${name} official audio`, { maxResults: 16, musicOnly: true });
  const named = name ? await dataApiSearch(`${name} songs`, { maxResults: 12, musicOnly: true }) : [];
  const seen = new Set<string>();
  const out: YouTubeVideo[] = [];
  for (const v of [...local, ...live, ...named]) {
    if (!v.videoId || v.videoId === exclude || seen.has(v.videoId)) continue;
    seen.add(v.videoId);
    out.push(v);
  }
  return out.slice(0, 16);
}

export async function searchVideos(q: string, opts?: YtSearchOpts): Promise<YouTubeVideo[]> {
  return dataApiSearch(q, { musicOnly: false, maxResults: 24, ...opts });
}

function mergeVideos(...lists: YouTubeVideo[][]): YouTubeVideo[] {
  const seen = new Set<string>();
  const out: YouTubeVideo[] = [];
  for (const list of lists) {
    for (const v of list) {
      if (!v.videoId || seen.has(v.videoId)) continue;
      seen.add(v.videoId);
      out.push(v);
    }
  }
  return out;
}

/** Primary music search used by Search — live catalog, no YouTube chrome. */
export async function searchMusic(q: string, opts?: YtSearchOpts): Promise<YouTubeVideo[]> {
  const region = opts?.regionCode;
  const max = opts?.maxResults ?? 36;
  const needle = q.trim();
  if (!needle) return [];

  const live = await dataApiSearch(needle, {
    regionCode: region,
    maxResults: 32,
    musicOnly: false,
    order: "relevance",
  });
  if (live.length >= 8) return live.slice(0, max);

  const [unregioned, innertube, extra] = await Promise.all([
    region
      ? dataApiSearch(needle, { maxResults: 24, musicOnly: false, order: "relevance" })
      : Promise.resolve([] as YouTubeVideo[]),
    innertubeSearch(needle, 24),
    rapidKey() ? rapidSearch(needle, 20) : Promise.resolve([] as YouTubeVideo[]),
  ]);
  let out = mergeVideos(live, unregioned, innertube, extra);
  if (out.length === 0) out = mergeVideos(await invidiousSearch(needle, 24), localSearch(needle));
  return out.slice(0, max);
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

export async function searchArtists(q: string): Promise<YouTubeVideo[]> {
  return dataApiSearch(`${q} official artist`, { musicOnly: true, maxResults: 16 });
}

export async function getRelatedVideos(videoId: string): Promise<YouTubeVideo[]> {
  const key = apiKey();
  if (!key) {
    return LOCAL_YOUTUBE_CATALOG.filter((v) => v.videoId !== videoId).slice(0, 4);
  }
  // relatedToVideoId is deprecated on many keys — fall back to topic search from the title
  const detail = await getVideoDetails(videoId);
  if (detail?.title) {
    return (await searchMusic(detail.title)).filter((v) => v.videoId !== videoId).slice(0, 8);
  }
  return LOCAL_YOUTUBE_CATALOG.filter((v) => v.videoId !== videoId).slice(0, 4);
}

export async function getPlaylistDetails(playlistId: string): Promise<{
  id: string;
  title: string;
  videos: YouTubeVideo[];
} | null> {
  const key = apiKey();
  if (!key) return null;
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=8&playlistId=${playlistId}&key=${key}`;
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
  youtubeVideoToTrack,
};
