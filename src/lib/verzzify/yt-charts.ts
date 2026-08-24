import type { NearbyScene, YouTubeVideo, YtArtistCard, YtPlaylistCard } from "./types";
import { createServerFn } from "@tanstack/react-start";

export const REGION_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  IE: "Ireland",
  PT: "Portugal",
  NG: "Nigeria",
  GH: "Ghana",
  ZA: "South Africa",
  KE: "Kenya",
  TZ: "Tanzania",
  UG: "Uganda",
  SN: "Senegal",
  CI: "Côte d'Ivoire",
  BR: "Brazil",
  MX: "Mexico",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  PE: "Peru",
  KR: "South Korea",
  JP: "Japan",
  IN: "India",
  PK: "Pakistan",
  BD: "Bangladesh",
  PH: "Philippines",
  ID: "Indonesia",
  TH: "Thailand",
  VN: "Vietnam",
  FR: "France",
  DE: "Germany",
  ES: "Spain",
  IT: "Italy",
  NL: "Netherlands",
  BE: "Belgium",
  PL: "Poland",
  SE: "Sweden",
  TR: "Turkey",
  CA: "Canada",
  AU: "Australia",
  NZ: "New Zealand",
  JM: "Jamaica",
  EG: "Egypt",
  MA: "Morocco",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  TW: "Taiwan",
  HK: "Hong Kong",
  UY: "Uruguay",
  MY: "Malaysia",
};

export const REGION_LIST = [
  "US",
  "GB",
  "PT",
  "NG",
  "GH",
  "ZA",
  "BR",
  "MX",
  "KR",
  "JP",
  "IN",
  "FR",
  "DE",
  "CA",
  "AU",
] as const;

/** Nearby music markets used to fill Home when we know the listener's country. */
export const NEARBY_REGIONS: Record<string, string[]> = {
  US: ["CA", "MX", "JM"],
  CA: ["US", "GB", "JM"],
  MX: ["US", "CO", "BR"],
  GB: ["IE", "FR", "DE"],
  IE: ["GB", "FR", "US"],
  PT: ["ES", "BR", "FR"],
  ES: ["PT", "FR", "MX"],
  FR: ["ES", "DE", "GB"],
  DE: ["FR", "NL", "GB"],
  NL: ["DE", "BE", "GB"],
  BE: ["FR", "NL", "DE"],
  IT: ["FR", "ES", "DE"],
  NG: ["GH", "ZA", "SN"],
  GH: ["NG", "CI", "ZA"],
  ZA: ["NG", "GH", "KE"],
  KE: ["UG", "TZ", "ZA"],
  TZ: ["KE", "UG", "ZA"],
  UG: ["KE", "TZ", "NG"],
  SN: ["NG", "GH", "CI"],
  CI: ["GH", "SN", "NG"],
  BR: ["PT", "AR", "MX"],
  AR: ["BR", "CL", "UY"],
  CO: ["MX", "BR", "US"],
  CL: ["AR", "BR", "PE"],
  PE: ["CL", "CO", "BR"],
  KR: ["JP", "TW", "US"],
  JP: ["KR", "TW", "US"],
  IN: ["PK", "BD", "GB"],
  PK: ["IN", "AE", "GB"],
  BD: ["IN", "PK", "GB"],
  PH: ["ID", "JP", "US"],
  ID: ["MY", "PH", "AU"],
  TH: ["VN", "ID", "KR"],
  VN: ["TH", "KR", "JP"],
  AU: ["NZ", "US", "GB"],
  NZ: ["AU", "GB", "US"],
  JM: ["US", "GB", "NG"],
  EG: ["SA", "MA", "AE"],
  MA: ["FR", "EG", "ES"],
  AE: ["SA", "IN", "EG"],
  SA: ["AE", "EG", "IN"],
  TR: ["DE", "FR", "GB"],
  PL: ["DE", "SE", "GB"],
  SE: ["DE", "GB", "US"],
  TW: ["JP", "KR", "HK"],
  HK: ["TW", "KR", "JP"],
};

export function normalizeRegion(input?: string | null): string {
  const raw = (input ?? "US").trim().toUpperCase();
  if (raw === "UK") return "GB";
  if (raw.length === 2 && /^[A-Z]{2}$/.test(raw) && raw !== "XX" && raw !== "T1") {
    return raw;
  }
  const hit = Object.entries(REGION_NAMES).find(([, n]) => n.toUpperCase() === raw);
  return hit?.[0] ?? "US";
}

function vid(id: string, title: string, channel: string, channelId: string | null = null): YouTubeVideo {
  return {
    videoId: id,
    title,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    channelName: channel,
    channelId,
    channelUrl: channelId ? `https://www.youtube.com/channel/${channelId}` : null,
    publishedAt: null,
    description: "Official video on YouTube.",
    durationSeconds: null,
    embeddable: true,
    url: `https://www.youtube.com/watch?v=${id}`,
    viewCount: null,
    likeCount: null,
    source: "youtube",
  };
}

const INDEX: Record<string, YouTubeVideo> = Object.fromEntries(
  [
    vid("4NRXx6U8ABQ", "The Weeknd - Blinding Lights (Official Video)", "TheWeekndVEVO"),
    vid("tQ0yjYUFKAE", "Justin Bieber - Peaches ft. Daniel Caesar, Giveon", "JustinBieberVEVO"),
    vid("OPf0YbXqDm0", "Mark Ronson - Uptown Funk ft. Bruno Mars", "MarkRonsonVEVO"),
    vid("uxpDa-c-4Mc", "Drake - Hotline Bling", "DrakeVEVO"),
    vid("nfWlot6h_JM", "Taylor Swift - Shake It Off", "Taylor Swift"),
    vid("e-ORhEE9VVg", "Taylor Swift - Blank Space", "Taylor Swift"),
    vid("CevxZvSJLk8", "Katy Perry - Roar", "KatyPerryVEVO"),
    vid("09R8_2nJtjg", "Maroon 5 - Sugar (Official Music Video)", "Maroon5VEVO"),
    vid("YykjpeuMNEk", "Coldplay - Hymn For The Weekend (Official Video)", "Coldplay"),
    vid("JGwWNGJdvx8", "Ed Sheeran - Shape of You (Official Music Video)", "Ed Sheeran"),
    vid("YQHsXMglC9A", "Adele - Hello (Official Music Video)", "Adele"),
    vid("lp-EO5I60KA", "Ed Sheeran - Thinking Out Loud (Official Music Video)", "Ed Sheeran"),
    vid("2Vv-BfVoq4g", "Ed Sheeran - Perfect (Official Music Video)", "Ed Sheeran"),
    vid("rYEDA3JcQqw", "Adele - Rolling in the Deep (Official Music Video)", "Adele"),
    vid("hLQl3WQQoQ0", "Adele - Someone Like You (Official Music Video)", "Adele"),
    vid("fJ9rUzIMcZQ", "Queen – Bohemian Rhapsody (Official Video Remastered)", "Queen Official"),
    vid("kJQP7kiw5Fk", "Luis Fonsi - Despacito ft. Daddy Yankee", "LuisFonsiVEVO"),
    vid("9bZkp7q19f0", "PSY - GANGNAM STYLE (강남스타일) M/V", "officialpsy"),
    vid("pRpeEdMmmQ0", "Shakira - Waka Waka (This Time for Africa)", "shakiraVEVO"),
    vid("gdZLi9oWNZg", "BTS (방탄소년단) 'Dynamite' Official MV", "HYBE LABELS"),
    vid("WMweEpGlu_U", "BTS (방탄소년단) 'Butter' Official MV", "HYBE LABELS"),
    vid("dyRsYk0LyA8", "BLACKPINK - 'Lovesick Girls' M/V", "BLACKPINK"),
    vid("x8VYWazR5mE", "YOASOBI「夜に駆ける」 Official Music Video", "YOASOBI"),
    vid("GIDiI5kyBDQ", "Black Sherif - Kwaku the Traveller (Official Video)", "Black Sherif Music", "UCKfrbVDBEq-wcYC4rUzEosA"),
    vid("NPCC02SaJVg", "King Promise - Terminator feat. Young Jonn", "KingPromiseVEVO"),
    vid("421w1j87fEM", "Burna Boy - Last Last [Official Music Video]", "Burna Boy"),
    vid("WvxADzZMkEI", "Uncle Waffles and Tony Duardo - Tanzania", "Uncle Waffles"),
    vid("tQiNQL-FEgU", "Free Mind", "Tems - Topic"),
    vid("fRh_vgS2dFE", "Justin Bieber - Sorry (PURPOSE : The Movement)", "JustinBieberVEVO"),
    vid("H5v3kku4y6Q", "Harry Styles - As It Was (Official Video)", "HarryStylesVEVO"),
    vid("kXYiU_JCYtU", "Numb (Official Music Video) – Linkin Park", "Linkin Park"),
    vid("hT_nvWreIhg", "OneRepublic - Counting Stars", "OneRepublicVEVO"),
    vid("fKopy74weus", "Imagine Dragons - Thunder", "ImagineDragonsVEVO"),
    vid("p47fEXGabaY", "Ricky Martin - Livin' La Vida Loca", "RickyMartinVEVO"),
    vid("sCbbMZ-q4-I", "Lut Gaye (Full Song) Emraan Hashmi, Yukti | Jubin N", "T-Series"),
    vid("k2qgadSvNyU", "Dua Lipa - New Rules (Official Music Video)", "Dua Lipa"),
    vid("RgKAFK5djSk", "Wiz Khalifa - See You Again ft. Charlie Puth", "Wiz Khalifa Music"),
    vid("j5-yKhDd64s", "Eminem - Not Afraid", "EminemVEVO"),
    vid("YVkUvmDQ3HY", "Eminem - Without Me (Official Music Video)", "EminemVEVO"),
    vid("RJMpeYwifEU", "Magic System - 1er Gaou", "Magic System"),
    vid("Q8KzMH0RstM", "Magic System - 1er Gaou (Original)", "Magic System"),
    vid("hOCBK373mJo", "DJ Arafat - Kpangor", "DJ Arafat"),
    vid("5RXimtgpLb8", "DJ Arafat - Kpangor", "DJ Arafat"),
    vid("jNPdBP_4dyc", "Alpha Blondy - Cocody Rock", "Alpha Blondy"),
    vid("lvCCqkkweyw", "Serge Beynaud - C'est Dosé", "Serge Beynaud"),
    vid("LoL_PSDSoh0", "Meiway - 200% Zoblazo", "Meiway"),
    vid("fFoThCFlD3c", "Tiken Jah Fakoly - Plus rien ne m'étonne", "Tiken Jah Fakoly"),
  ].map((v) => [v.videoId, v]),
);

export const ALL_YT_VIDEOS: YouTubeVideo[] = Object.values(INDEX);

const REGION_IDS: Record<string, string[]> = {
  US: ["4NRXx6U8ABQ", "tQ0yjYUFKAE", "OPf0YbXqDm0", "uxpDa-c-4Mc", "nfWlot6h_JM", "e-ORhEE9VVg", "CevxZvSJLk8", "09R8_2nJtjg", "YykjpeuMNEk", "RgKAFK5djSk", "j5-yKhDd64s", "fKopy74weus"],
  GB: ["JGwWNGJdvx8", "YQHsXMglC9A", "lp-EO5I60KA", "2Vv-BfVoq4g", "rYEDA3JcQqw", "hLQl3WQQoQ0", "H5v3kku4y6Q", "fJ9rUzIMcZQ", "k2qgadSvNyU"],
  PT: ["JGwWNGJdvx8", "kJQP7kiw5Fk", "H5v3kku4y6Q", "YQHsXMglC9A", "p47fEXGabaY", "2Vv-BfVoq4g", "x8VYWazR5mE", "k2qgadSvNyU"],
  NG: ["421w1j87fEM", "tQiNQL-FEgU", "GIDiI5kyBDQ", "NPCC02SaJVg", "WvxADzZMkEI", "pRpeEdMmmQ0"],
  GH: ["GIDiI5kyBDQ", "NPCC02SaJVg", "421w1j87fEM", "tQiNQL-FEgU", "pRpeEdMmmQ0"],
  ZA: ["WvxADzZMkEI", "421w1j87fEM", "tQiNQL-FEgU", "pRpeEdMmmQ0", "GIDiI5kyBDQ"],
  BR: ["kJQP7kiw5Fk", "p47fEXGabaY", "pRpeEdMmmQ0", "OPf0YbXqDm0", "JGwWNGJdvx8"],
  MX: ["kJQP7kiw5Fk", "p47fEXGabaY", "pRpeEdMmmQ0", "CevxZvSJLk8", "nfWlot6h_JM"],
  KR: ["9bZkp7q19f0", "gdZLi9oWNZg", "WMweEpGlu_U", "dyRsYk0LyA8", "x8VYWazR5mE"],
  JP: ["x8VYWazR5mE", "gdZLi9oWNZg", "9bZkp7q19f0", "WMweEpGlu_U", "YykjpeuMNEk"],
  IN: ["sCbbMZ-q4-I", "JGwWNGJdvx8", "YQHsXMglC9A", "OPf0YbXqDm0", "gdZLi9oWNZg"],
  FR: ["k2qgadSvNyU", "YykjpeuMNEk", "kJQP7kiw5Fk", "H5v3kku4y6Q", "JGwWNGJdvx8"],
  DE: ["kXYiU_JCYtU", "fKopy74weus", "hT_nvWreIhg", "j5-yKhDd64s", "YVkUvmDQ3HY"],
  ES: ["kJQP7kiw5Fk", "p47fEXGabaY", "pRpeEdMmmQ0", "CevxZvSJLk8"],
  CA: ["4NRXx6U8ABQ", "uxpDa-c-4Mc", "tQ0yjYUFKAE", "JGwWNGJdvx8", "fKopy74weus"],
  AU: ["hT_nvWreIhg", "fKopy74weus", "JGwWNGJdvx8", "H5v3kku4y6Q", "OPf0YbXqDm0"],
  JM: ["uxpDa-c-4Mc", "pRpeEdMmmQ0", "421w1j87fEM", "OPf0YbXqDm0"],
  SN: ["tQiNQL-FEgU", "421w1j87fEM", "pRpeEdMmmQ0", "WvxADzZMkEI"],
  CI: ["RJMpeYwifEU", "Q8KzMH0RstM", "hOCBK373mJo", "lvCCqkkweyw", "LoL_PSDSoh0", "jNPdBP_4dyc", "fFoThCFlD3c"],
};

function curatedIds(code: string): string[] {
  return REGION_IDS[code] ?? [];
}

/** Artist / scene words that belong to a country. Used to stop neighbor leak. */
const LOCAL_MARKERS: Record<string, string[]> = {
  GH: ["black sherif", "king promise", "sarkodie", "stonebwoy", "shatta wale", "kuami eugene", "gyakie", "accra", "ghana"],
  NG: ["burna boy", "wizkid", "davido", "rema", "tems", "asake", "lagos", "nigeria"],
  CI: [
    "dj arafat",
    "magic system",
    "serge beynaud",
    "alpha blondy",
    "tiken jah",
    "meiway",
    "mix premier",
    "roseline layo",
    "didi b",
    "debordo",
    "kedjevara",
    "kiff no beat",
    "suspect 95",
    "coupe decale",
    "coupé-décalé",
    "zouglou",
    "abidjan",
    "ivoir",
    "cocody",
  ],
  SN: ["youssou", "mbalax", "dakar", "senegal"],
  ZA: ["amapiano", "uncle waffles", "tyla", "johannesburg", "south africa"],
};

function blobOf(v: YouTubeVideo): string {
  return `${v.title} ${v.channelName} ${v.description ?? ""}`.toLowerCase();
}

const ARTIST_DISPLAY: Array<[string, string]> = [
  ["dj arafat", "DJ Arafat"],
  ["magic system", "Magic System"],
  ["serge beynaud", "Serge Beynaud"],
  ["alpha blondy", "Alpha Blondy"],
  ["tiken jah", "Tiken Jah Fakoly"],
  ["meiway", "Meiway"],
  ["mix premier", "Mix Premier"],
  ["roseline layo", "Roseline Layo"],
  ["didi b", "Didi B"],
  ["debordo", "Debordo Leekunfa"],
  ["kedjevara", "Kedjevara"],
  ["kiff no beat", "Kiff No Beat"],
  ["suspect 95", "Suspect 95"],
  ["black sherif", "Black Sherif"],
  ["king promise", "King Promise"],
];

export function prettyArtistName(raw: string): string {
  const stripped = raw
    .replace(/\s*(- ?topic|vevo|officiel|official|music)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const key = stripped.toLowerCase();
  for (const [needle, name] of ARTIST_DISPLAY) {
    if (key.includes(needle)) return name;
  }
  return stripped;
}

export function filterVideosForRegion(code: string, videos: YouTubeVideo[]): YouTubeVideo[] {
  const local = LOCAL_MARKERS[code] ?? [];
  const neighborMarks = (NEARBY_REGIONS[code] ?? [])
    .filter((n) => n !== code)
    .flatMap((n) => LOCAL_MARKERS[n] ?? []);
  const exclude = code === "CI" ? ["francis mercier"] : [];
  const renamed = videos.map((v) => ({ ...v, channelName: prettyArtistName(v.channelName) }));
  if (!local.length && !neighborMarks.length && !exclude.length) return renamed;
  const kept = renamed.filter((v) => {
    const blob = blobOf(v);
    if (exclude.some((m) => blob.includes(m))) return false;
    const hitsLocal = local.some((m) => blob.includes(m));
    const hitsNeighbor = neighborMarks.some((m) => blob.includes(m));
    if (hitsNeighbor && !hitsLocal) return false;
    return true;
  });
  return kept.length ? kept : renamed.filter((v) => !neighborMarks.some((m) => blobOf(v).includes(m)));
}

function mapDataItem(v: {
  id: string;
  snippet?: {
    title?: string;
    channelTitle?: string;
    channelId?: string;
    publishedAt?: string;
    description?: string;
    thumbnails?: { high?: { url?: string } };
  };
  contentDetails?: { duration?: string };
  status?: { embeddable?: boolean; privacyStatus?: string };
  statistics?: { viewCount?: string; likeCount?: string };
}): YouTubeVideo {
  const id = v.id;
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
    embeddable: v.status?.embeddable !== false,
    url: `https://www.youtube.com/watch?v=${id}`,
    viewCount: v.statistics?.viewCount ? Number(v.statistics.viewCount) : null,
    likeCount: v.statistics?.likeCount ? Number(v.statistics.likeCount) : null,
    source: "youtube",
  };
}

const REGION_SEARCH: Record<string, string[]> = {
  GH: ["ghana afrobeats official", "highlife ghana official", "amapiano ghana"],
  NG: ["afrobeats nigeria official", "amapiano nigeria official", "afro house nigeria"],
  ZA: ["amapiano south africa official", "south africa house music"],
  KE: ["kenya music official", "genge kapuka"],
  SN: ["mbalax senegal", "afrobeats senegal"],
  CI: ["coupe decale abidjan", "DJ Arafat Magic System Serge Beynaud", "zouglou ivoire official"],
  JM: ["dancehall jamaica official", "reggae jamaica official"],
  US: ["hip hop official video", "rnb official 2024"],
  GB: ["uk drill official", "uk afrobeats official"],
  BR: ["funk brasileiro official", "sertanejo official"],
  MX: ["musica urbana mexico", "reggaeton official"],
  KR: ["kpop official mv", "k hip hop official"],
  JP: ["jpop official", "city pop official"],
  IN: ["bollywood songs official", "punjabi songs official"],
  FR: ["rap francais official", "afrobeats france"],
  DE: ["deutschrap official", "afrobeats germany"],
  PT: ["musica portuguesa official", "afrohouse portugal"],
  ES: ["reggaeton espana official", "urban latin official"],
  CA: ["canadian hip hop official", "toronto rnb official"],
  AU: ["australian hip hop official", "afrobeats australia"],
};

async function hydrateIds(ids: string[], key: string): Promise<YouTubeVideo[]> {
  if (!ids.length) return [];
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${ids.slice(0, 40).join(",")}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: Parameters<typeof mapDataItem>[0][] };
  return (json.items ?? []).map(mapDataItem);
}

async function searchRegionMusic(code: string, q: string, key: string, order = "relevance"): Promise<YouTubeVideo[]> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&regionCode=${encodeURIComponent(code)}&maxResults=12&order=${order}&q=${encodeURIComponent(q)}&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = (await res.json()) as { items?: Array<{ id?: { videoId?: string } }> };
    const ids = (json.items ?? []).map((i) => i.id?.videoId).filter(Boolean) as string[];
    return hydrateIds(ids, key);
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

function railLabel(q: string): string {
  const s = q.toLowerCase();
  if (s.includes("amapiano")) return "Amapiano";
  if (s.includes("highlife")) return "Highlife";
  if (s.includes("afrobeats") || s.includes("afrobeat")) return "Afrobeats";
  if (s.includes("drill")) return "Drill";
  if (s.includes("kpop")) return "K-pop";
  if (s.includes("jpop") || s.includes("city pop")) return "J-pop";
  if (s.includes("bollywood") || s.includes("punjabi")) return "South Asia";
  if (s.includes("dancehall") || s.includes("reggae")) return "Dancehall & reggae";
  if (s.includes("reggaeton") || s.includes("urbana") || s.includes("latin")) return "Urbano";
  if (s.includes("funk") || s.includes("sertanejo")) return "Brazil";
  if (s.includes("hip hop") || s.includes("rap")) return "Hip hop";
  if (s.includes("rnb") || s.includes("r&b")) return "R&B";
  return "Scene mix";
}

const cache = new Map<string, { at: number; videos: YouTubeVideo[] }>();
const TTL = 20 * 60 * 1000;

export async function getPopularMusicByCountry(region: string): Promise<YouTubeVideo[]> {
  const code = normalizeRegion(region);
  const hit = cache.get(`v3:${code}`);
  if (hit && Date.now() - hit.at < TTL) return hit.videos;

  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (key) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&chart=mostPopular&regionCode=${code}&videoCategoryId=10&maxResults=32&key=${key}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = (await res.json()) as { items?: Parameters<typeof mapDataItem>[0][] };
        const videos = filterVideosForRegion(code, (json.items ?? []).map(mapDataItem));
        if (videos.length) {
          cache.set(`v3:${code}`, { at: Date.now(), videos });
          return videos;
        }
      }
    } catch {
      /* fall through to curated list */
    }
  }

  const videos = filterVideosForRegion(
    code,
    curatedIds(code).map((id) => INDEX[id]).filter(Boolean),
  );
  cache.set(`v3:${code}`, { at: Date.now(), videos });
  return videos;
}

export function artistsFromVideos(videos: YouTubeVideo[]): YtArtistCard[] {
  const seen = new Map<string, YtArtistCard>();
  for (const v of videos) {
    const key = v.channelId ?? v.channelName;
    if (seen.has(key)) continue;
    seen.set(key, {
      channelId: key,
      channelName: prettyArtistName(v.channelName),
      avatarUrl: v.thumbnailUrl,
      channelUrl: v.channelUrl,
      sampleVideoId: v.videoId,
    });
  }
  return [...seen.values()];
}

export function searchLocalYoutube(q: string): YouTubeVideo[] {
  const n = q.trim().toLowerCase();
  if (!n) return [];
  return ALL_YT_VIDEOS.filter(
    (v) => v.title.toLowerCase().includes(n) || v.channelName.toLowerCase().includes(n),
  );
}

function playlistsFrom(code: string, regionName: string, videos: YouTubeVideo[], extra: YouTubeVideo[] = []): YtPlaylistCard[] {
  const a = videos.slice(0, 8);
  const b = videos.slice(2, 10);
  const c = [...videos].reverse().slice(0, 8);
  const n = extra.slice(0, 8);
  const fresh = extra.slice(0, 10);
  const cover = (list: YouTubeVideo[]) => list[0]?.thumbnailUrl ?? "/covers/night-market.jpg";
  return [
    {
      id: `today-${code}`,
      title: `Today in ${regionName}`,
      subtitle: "What’s on repeat nearby",
      thumbnailUrl: cover(a),
      videos: a,
    },
    {
      id: `new-${code}`,
      title: `New in ${regionName}`,
      subtitle: "Fresh cuts this week",
      thumbnailUrl: cover(fresh.length ? fresh : a),
      videos: fresh.length ? fresh : a,
    },
    {
      id: `drive-${code}`,
      title: `${regionName} drive mix`,
      subtitle: "Songs for the commute",
      thumbnailUrl: cover(b.length ? b : a),
      videos: b.length ? b : a,
    },
    {
      id: `weekend-${code}`,
      title: `${regionName} weekend`,
      subtitle: "Playlists for the block",
      thumbnailUrl: cover(n.length ? n : c),
      videos: n.length ? n : c,
    },
    {
      id: `after-${code}`,
      title: "After dark",
      subtitle: `Late in ${regionName}`,
      thumbnailUrl: cover(c.length ? c : a),
      videos: c.length ? c : a,
    },
  ].filter((p) => p.videos.length);
}

function mixFeed(local: YouTubeVideo[], nearby: NearbyScene[]): YouTubeVideo[] {
  const seen = new Set<string>();
  const out: YouTubeVideo[] = [];
  const lanes = [local, ...nearby.map((n) => n.videos)];
  let i = 0;
  let added = true;
  while (out.length < 40 && added) {
    added = false;
    for (const lane of lanes) {
      const v = lane[i];
      if (v && !seen.has(v.videoId)) {
        seen.add(v.videoId);
        out.push(v);
        added = true;
      }
    }
    i += 1;
  }
  return out;
}

export type YoutubeHomeData = {
  region: string;
  regionName: string;
  city: string | null;
  videos: YouTubeVideo[];
  newSongs: YouTubeVideo[];
  artists: YtArtistCard[];
  playlists: YtPlaylistCard[];
  nearby: NearbyScene[];
  feed: YouTubeVideo[];
  rails: { id: string; title: string; subtitle: string; videos: YouTubeVideo[] }[];
};

export async function loadYoutubeHome(region: string, city: string | null = null): Promise<YoutubeHomeData> {
  const code = normalizeRegion(region);
  const videos = await getPopularMusicByCountry(code);
  const neighborCodes = (NEARBY_REGIONS[code] ?? ["US", "GB", "NG"]).filter((c) => c !== code).slice(0, 3);
  const nearby = (
    await Promise.all(
      neighborCodes.map(async (c) => {
        const nv = await getPopularMusicByCountry(c);
        return {
          region: c,
          regionName: REGION_NAMES[c] ?? c,
          videos: nv,
          artists: artistsFromVideos(nv),
        } satisfies NearbyScene;
      }),
    )
  ).filter((n) => n.videos.length);
  const neighborMix = nearby.flatMap((n) => n.videos).slice(0, 8);
  const name = REGION_NAMES[code] ?? code;
  const key = process.env.YOUTUBE_API_KEY?.trim();
  let newSongs: YouTubeVideo[] = [];
  const rails: YoutubeHomeData["rails"] = [];
  if (key) {
    const [fresh, ...found] = await Promise.all([
      searchRegionMusic(code, `${name} new song official 2026`, key, "date"),
      ...(REGION_SEARCH[code] ?? [`${name} official music`]).slice(0, 3).map(async (q) => ({
        q,
        videos: filterVideosForRegion(code, await searchRegionMusic(code, q, key)),
      })),
    ]);
    newSongs = dedupe(filterVideosForRegion(code, Array.isArray(fresh) ? fresh : [])).filter(
      (v) => !videos.some((x) => x.videoId === v.videoId),
    );
    for (const row of found) {
      if (!row || Array.isArray(row)) continue;
      const list = dedupe(row.videos).filter((v) => !videos.some((x) => x.videoId === v.videoId));
      if (list.length >= 4) {
        rails.push({
          id: `${code}-${railLabel(row.q).toLowerCase().replace(/\s+/g, "-")}`,
          title: railLabel(row.q),
          subtitle: `${name} catalog`,
          videos: list,
        });
      }
    }
  }
  const playlists = playlistsFrom(code, name, videos, newSongs);
  if (neighborMix.length) {
    playlists.push({
      id: `region-${code}`,
      title: "From the region",
      subtitle: nearby.map((n) => n.regionName).join(" · "),
      thumbnailUrl: neighborMix[0]?.thumbnailUrl ?? videos[0]?.thumbnailUrl ?? "",
      videos: neighborMix,
    });
  }
  for (const n of nearby) {
    if (n.videos.length >= 4) {
      playlists.push({
        id: `pl-${n.region}`,
        title: `${n.regionName} mix`,
        subtitle: "Next door on VerzZify",
        thumbnailUrl: n.videos[0]?.thumbnailUrl ?? "",
        videos: n.videos.slice(0, 10),
      });
    }
  }
  return {
    region: code,
    regionName: name,
    city,
    videos,
    newSongs,
    artists: artistsFromVideos(videos),
    playlists,
    nearby,
    feed: mixFeed(newSongs.length ? [...newSongs.slice(0, 6), ...videos] : videos, nearby),
    rails,
  };
}

export const getYoutubeHome = createServerFn({ method: "GET" })
  .validator((region: string) => normalizeRegion(region))
  .handler(async ({ data: region }) => loadYoutubeHome(region));

