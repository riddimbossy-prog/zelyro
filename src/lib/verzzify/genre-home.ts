import { createServerFn } from "@tanstack/react-start";
import { getGenre, genreQueries, type GenreDef } from "./genres";
import {
  artistsFromVideos,
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

function vid(id: string, title: string, channel: string): YouTubeVideo {
  return {
    videoId: id,
    title,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    channelName: channel,
    channelId: null,
    channelUrl: null,
    publishedAt: null,
    description: null,
    durationSeconds: null,
    embeddable: true,
    url: `https://www.youtube.com/watch?v=${id}`,
    viewCount: null,
    likeCount: null,
    source: "youtube",
  };
}

/** Distinct offline seeds so genres never collapse to the same regional chart. */
const GENRE_SEEDS: Record<string, YouTubeVideo[]> = {
  gospel: [
    vid("CveANi17YxM", "Travis Greene - Made a Way (Live)", "Travis Greene"),
    vid("0xgUn3kXZ5A", "Elevation Worship - O Come to the Altar", "Elevation Worship"),
    vid("dJ8VjyP8aFc", "Nathaniel Bassey - Imela", "Nathaniel Bassey"),
    vid("YzwjWKF_ikU", "Sinach - Way Maker", "Sinach"),
    vid("2OEL4P1Rz04", "Hillsong Worship - What A Beautiful Name", "Hillsong Worship"),
    vid("3YaaUkBHbmI", "Joe Mettle - My Everything", "Joe Mettle"),
  ],
  afrobeats: [
    vid("421w1j87fEM", "Burna Boy - Last Last", "Burna Boy"),
    vid("tQiNQL-FEgU", "Tems - Free Mind", "Tems"),
    vid("GIDiI5kyBDQ", "Black Sherif - Kwaku the Traveller", "Black Sherif"),
    vid("NPCC02SaJVg", "King Promise - Terminator", "King Promise"),
    vid("5X-Mrc2l1dU", "Wizkid - Essence", "Wizkid"),
    vid("1k8craCGpgs", "Rema - Calm Down", "Rema"),
  ],
  amapiano: [
    vid("WvxADzZMkEI", "Uncle Waffles - Tanzania", "Uncle Waffles"),
    vid("oqJdWkE5hTM", "Tyla - Water", "Tyla"),
    vid("qK5KhQG06xU", "Kabza De Small - Scorpion Kings", "Kabza De Small"),
    vid("lY2yjAdbvdQ", "Focalistic - Ke Star", "Focalistic"),
  ],
  "hip-hop": [
    vid("j5-yKhDd64s", "Eminem - Not Afraid", "Eminem"),
    vid("YVkUvmDQ3HY", "Eminem - Without Me", "Eminem"),
    vid("uxpDa-c-4Mc", "Drake - Hotline Bling", "Drake"),
    vid("RgKAFK5djSk", "Wiz Khalifa - See You Again", "Wiz Khalifa"),
    vid("gCYcHz2k5x0", "Kendrick Lamar - HUMBLE.", "Kendrick Lamar"),
  ],
  rnb: [
    vid("4NRXx6U8ABQ", "The Weeknd - Blinding Lights", "The Weeknd"),
    vid("tQ0yjYUFKAE", "Justin Bieber - Peaches", "Justin Bieber"),
    vid("lp-EO5I60KA", "Ed Sheeran - Thinking Out Loud", "Ed Sheeran"),
    vid("H5v3kku4y6Q", "Harry Styles - As It Was", "Harry Styles"),
  ],
  pop: [
    vid("JGwWNGJdvx8", "Ed Sheeran - Shape of You", "Ed Sheeran"),
    vid("nfWlot6h_JM", "Taylor Swift - Shake It Off", "Taylor Swift"),
    vid("k2qgadSvNyU", "Dua Lipa - New Rules", "Dua Lipa"),
    vid("CevxZvSJLk8", "Katy Perry - Roar", "Katy Perry"),
    vid("09R8_2nJtjg", "Maroon 5 - Sugar", "Maroon 5"),
  ],
  rock: [
    vid("fJ9rUzIMcZQ", "Queen – Bohemian Rhapsody", "Queen"),
    vid("kXYiU_JCYtU", "Linkin Park - Numb", "Linkin Park"),
    vid("fKopy74weus", "Imagine Dragons - Thunder", "Imagine Dragons"),
    vid("hT_nvWreIhg", "OneRepublic - Counting Stars", "OneRepublic"),
  ],
  latin: [
    vid("kJQP7kiw5Fk", "Luis Fonsi - Despacito", "Luis Fonsi"),
    vid("p47fEXGabaY", "Ricky Martin - Livin' La Vida Loca", "Ricky Martin"),
    vid("pRpeEdMmmQ0", "Shakira - Waka Waka", "Shakira"),
  ],
  electronic: [
    vid("IcrbM1l_BoI", "Avicii - Wake Me Up", "Avicii"),
    vid("fKopy74weus", "Imagine Dragons - Thunder", "Imagine Dragons"),
    vid("YykjpeuMNEk", "Coldplay - Hymn For The Weekend", "Coldplay"),
  ],
  dancehall: [
    vid("pRpeEdMmmQ0", "Shakira - Waka Waka", "Shakira"),
    vid("uxpDa-c-4Mc", "Drake - Hotline Bling", "Drake"),
  ],
  highlife: [
    vid("GIDiI5kyBDQ", "Black Sherif - Kwaku the Traveller", "Black Sherif"),
    vid("NPCC02SaJVg", "King Promise - Terminator", "King Promise"),
  ],
  reggae: [
    vid("pRpeEdMmmQ0", "Shakira - Waka Waka", "Shakira"),
    vid("jNPdBP_4dyc", "Alpha Blondy - Cocody Rock", "Alpha Blondy"),
  ],
  trap: [
    vid("uxpDa-c-4Mc", "Drake - Hotline Bling", "Drake"),
    vid("gCYcHz2k5x0", "Kendrick Lamar - HUMBLE.", "Kendrick Lamar"),
  ],
  indie: [
    vid("hT_nvWreIhg", "OneRepublic - Counting Stars", "OneRepublic"),
    vid("YykjpeuMNEk", "Coldplay - Hymn For The Weekend", "Coldplay"),
  ],
  "k-pop": [
    vid("gdZLi9oWNZg", "BTS - Dynamite", "HYBE LABELS"),
    vid("WMweEpGlu_U", "BTS - Butter", "HYBE LABELS"),
    vid("dyRsYk0LyA8", "BLACKPINK - Lovesick Girls", "BLACKPINK"),
    vid("9bZkp7q19f0", "PSY - GANGNAM STYLE", "officialpsy"),
  ],
  jazz: [
    vid("vmDDOFXSgAs", "Louis Armstrong - What A Wonderful World", "Louis Armstrong"),
  ],
  country: [
    vid("hT_nvWreIhg", "OneRepublic - Counting Stars", "OneRepublic"),
  ],
  classical: [
    vid("fJ9rUzIMcZQ", "Queen – Bohemian Rhapsody", "Queen"),
  ],
};

/** Words that must appear for a result to count toward this genre (loose OR). */
const GENRE_NEEDLES: Record<string, string[]> = {
  gospel: ["gospel", "worship", "christian", "praise", "choir", "hymn", "sinach", "hillsong"],
  afrobeats: ["afrobeats", "afrobeat", "naija", "burna", "wizkid", "davido", "rema", "tems", "asake", "hiplife"],
  amapiano: ["amapiano", "piano", "log drums", "kabza", "waffles", "tyla"],
  "hip-hop": ["hip hop", "hip-hop", "rap", "drill", "grime", "eminem", "kendrick"],
  rnb: ["r&b", "rnb", "soul", "weeknd", "r and b"],
  pop: ["pop", "top 40", "chart"],
  rock: ["rock", "metal", "punk", "alternative", "linkin", "queen"],
  latin: ["latin", "reggaeton", "salsa", "bachata", "urbano", "despacito", "spanish"],
  electronic: ["electronic", "edm", "house", "techno", "dance", "avicii", "dj"],
  dancehall: ["dancehall", "bashment", "reggae fusion"],
  highlife: ["highlife", "hiplife"],
  reggae: ["reggae", "roots", "marley", "blondy"],
  trap: ["trap", "drill"],
  indie: ["indie", "alternative"],
  "k-pop": ["kpop", "k-pop", "bts", "blackpink", "hybe", "jyp", "sm "],
  jazz: ["jazz", "bebop", "swing"],
  country: ["country", "nashville", "bluegrass"],
  classical: ["classical", "orchestra", "symphony", "piano concerto", "opera"],
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
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&regionCode=${encodeURIComponent(code)}&maxResults=18&order=${order}&q=${encodeURIComponent(q)}&key=${key}`;
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

function blobOf(v: YouTubeVideo): string {
  return `${v.title} ${v.channelName} ${v.description ?? ""}`.toLowerCase();
}

function genreScore(slug: string, v: YouTubeVideo): number {
  const needles = GENRE_NEEDLES[slug] ?? [slug.replace(/-/g, " ")];
  const blob = blobOf(v);
  let score = 0;
  for (const n of needles) {
    if (blob.includes(n)) score += n.length > 5 ? 3 : 2;
  }
  // Prefer official music packaging
  if (blob.includes("official")) score += 1;
  if (blob.includes("lyrics") || blob.includes("live performance")) score += 0.5;
  return score;
}

function keepGenre(slug: string, list: YouTubeVideo[], minKeep = 8): YouTubeVideo[] {
  const ranked = list
    .map((v) => ({ v, s: genreScore(slug, v) }))
    .sort((a, b) => b.s - a.s);
  const strong = ranked.filter((x) => x.s > 0).map((x) => x.v);
  if (strong.length >= minKeep) return strong;
  // Keep strong first, then unrated search hits (API already scoped by query)
  const rest = ranked.filter((x) => x.s === 0).map((x) => x.v);
  return dedupe([...strong, ...rest]).slice(0, 28);
}

const cache = new Map<string, { at: number; data: GenreHomeData }>();
const TTL = 12 * 60 * 1000;

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
  const seeds = GENRE_SEEDS[genre.slug] ?? [];

  let videos: YouTubeVideo[] = [];
  let newSongs: YouTubeVideo[] = [];
  const rails: GenreHomeData["rails"] = [];

  if (key) {
    const [popularBatches, fresh] = await Promise.all([
      Promise.all(queries.slice(0, 4).map((q) => searchGenre(code, q, key, "relevance"))),
      searchGenre(code, `${queries[0] ?? genre.name} new song official`, key, "date"),
    ]);
    // Do NOT run regional artist-marker filter here — it collapses genres to the same local chart.
    videos = keepGenre(genre.slug, dedupe(popularBatches.flat()));
    newSongs = keepGenre(
      genre.slug,
      dedupe(fresh).filter((v) => !videos.some((x) => x.videoId === v.videoId)),
      4,
    );

    for (const q of queries.slice(0, 3)) {
      const list = keepGenre(
        genre.slug,
        dedupe(await searchGenre(code, q, key, "viewCount")).filter(
          (v) => !videos.some((x) => x.videoId === v.videoId),
        ),
        4,
      );
      if (list.length >= 3) {
        rails.push({
          id: `${genre.slug}-${q.slice(0, 28).replace(/\s+/g, "-")}`,
          title: genre.name,
          subtitle: q,
          videos: list.slice(0, 12),
        });
      }
    }
  }

  // Seed-only fallback — never pad with generic regional home charts
  if (videos.length < 6) {
    videos = dedupe([...videos, ...seeds]);
  }
  if (newSongs.length < 3) {
    newSongs = dedupe([...newSongs, ...seeds.slice().reverse()]).filter(
      (v) => !videos.slice(0, 6).some((x) => x.videoId === v.videoId),
    );
  }

  // Nearby markets: genre search only; if empty, leave empty (no shared chart bleed)
  let nearby: GenreHomeData["nearby"] = [];
  try {
    const homeNear = await loadYoutubeHome(code, city);
    nearby = await Promise.all(
      homeNear.nearby.slice(0, 3).map(async (n) => {
        if (!key) {
          return { region: n.region, regionName: n.regionName, videos: [], artists: [] };
        }
        const q =
          genreQueries(genre, n.region, n.regionName)[0] ?? `${genre.name} ${n.regionName} official`;
        const nv = keepGenre(genre.slug, dedupe(await searchGenre(n.region, q, key, "relevance")), 3);
        return {
          region: n.region,
          regionName: n.regionName,
          videos: nv.slice(0, 12),
          artists: artistsFromVideos(nv).slice(0, 10),
        };
      }),
    );
    nearby = nearby.filter((n) => n.videos.length > 0);
  } catch {
    nearby = [];
  }

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
