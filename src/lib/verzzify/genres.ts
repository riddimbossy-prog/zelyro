export type GenreDef = {
  slug: string;
  name: string;
  emoji: string;
  /** CSS gradient for tactile chip */
  gradient: string;
  /** Accent glow / shadow */
  glow: string;
  /** YouTube search seeds; region name is interpolated as {place} */
  queries: string[];
  /** Optional region overrides for local scenes */
  regionQueries?: Record<string, string[]>;
};

export const GENRES: GenreDef[] = [
  {
    slug: "gospel",
    name: "Gospel",
    emoji: "🙏",
    gradient: "linear-gradient(145deg,#fbbf24 0%,#f59e0b 45%,#b45309 100%)",
    glow: "rgba(245,158,11,0.55)",
    queries: ["gospel music official", "worship songs official", "{place} gospel official"],
    regionQueries: {
      GH: ["ghana gospel official", "ghana worship songs"],
      NG: ["nigeria gospel official", "naija gospel"],
      US: ["gospel choir official", "contemporary christian music"],
      ZA: ["south africa gospel official"],
      JM: ["jamaican gospel official"],
    },
  },
  {
    slug: "afrobeats",
    name: "Afrobeats",
    emoji: "🔥",
    gradient: "linear-gradient(145deg,#fb923c 0%,#f97316 40%,#c2410c 100%)",
    glow: "rgba(249,115,22,0.55)",
    queries: ["afrobeats official", "{place} afrobeats official"],
    regionQueries: {
      NG: ["afrobeats nigeria official", "naija afrobeats 2026"],
      GH: ["ghana afrobeats official", "hiplife ghana"],
      GB: ["uk afrobeats official"],
      US: ["afrobeats usa official"],
    },
  },
  {
    slug: "amapiano",
    name: "Amapiano",
    emoji: "🎹",
    gradient: "linear-gradient(145deg,#a3e635 0%,#65a30d 50%,#3f6212 100%)",
    glow: "rgba(163,230,53,0.45)",
    queries: ["amapiano official", "{place} amapiano"],
    regionQueries: {
      ZA: ["amapiano south africa official", "piano hub"],
      NG: ["amapiano nigeria official"],
      GH: ["amapiano ghana official"],
    },
  },
  {
    slug: "hip-hop",
    name: "Hip Hop",
    emoji: "🎤",
    gradient: "linear-gradient(145deg,#e879f9 0%,#c026d3 50%,#86198f 100%)",
    glow: "rgba(192,38,211,0.55)",
    queries: ["hip hop official video", "{place} hip hop official"],
    regionQueries: {
      US: ["hip hop official 2026", "rap official music video"],
      FR: ["rap francais official"],
      GB: ["uk drill official", "grime official"],
      DE: ["deutschrap official"],
    },
  },
  {
    slug: "rnb",
    name: "R&B",
    emoji: "💜",
    gradient: "linear-gradient(145deg,#c084fc 0%,#7c3aed 50%,#4c1d95 100%)",
    glow: "rgba(124,58,237,0.55)",
    queries: ["r&b official music video", "{place} rnb official"],
  },
  {
    slug: "pop",
    name: "Pop",
    emoji: "✨",
    gradient: "linear-gradient(145deg,#67e8f9 0%,#06b6d4 45%,#0e7490 100%)",
    glow: "rgba(6,182,212,0.5)",
    queries: ["pop music official", "{place} pop official music video"],
  },
  {
    slug: "rock",
    name: "Rock",
    emoji: "🎸",
    gradient: "linear-gradient(145deg,#f87171 0%,#dc2626 45%,#7f1d1d 100%)",
    glow: "rgba(220,38,38,0.55)",
    queries: ["rock music official", "{place} rock band official"],
  },
  {
    slug: "latin",
    name: "Latin",
    emoji: "💃",
    gradient: "linear-gradient(145deg,#f472b6 0%,#db2777 45%,#9d174d 100%)",
    glow: "rgba(219,39,119,0.55)",
    queries: ["latin music official", "reggaeton official", "{place} musica latina"],
    regionQueries: {
      MX: ["musica urbana mexico", "reggaeton mexico"],
      CO: ["reggaeton colombia official"],
      ES: ["reggaeton espana official"],
      US: ["latin trap official"],
    },
  },
  {
    slug: "electronic",
    name: "Electronic",
    emoji: "⚡",
    gradient: "linear-gradient(145deg,#22d3ee 0%,#2563eb 50%,#1e3a8a 100%)",
    glow: "rgba(37,99,235,0.5)",
    queries: ["electronic music official", "edm official", "{place} electronic dance"],
  },
  {
    slug: "dancehall",
    name: "Dancehall",
    emoji: "🌴",
    gradient: "linear-gradient(145deg,#4ade80 0%,#16a34a 50%,#14532d 100%)",
    glow: "rgba(22,163,74,0.5)",
    queries: ["dancehall official", "{place} dancehall"],
    regionQueries: {
      JM: ["dancehall jamaica official", "reggae jamaica official"],
      GH: ["ghana dancehall official"],
      NG: ["nigeria dancehall official"],
    },
  },
  {
    slug: "highlife",
    name: "Highlife",
    emoji: "🎺",
    gradient: "linear-gradient(145deg,#fde047 0%,#eab308 50%,#a16207 100%)",
    glow: "rgba(234,179,8,0.5)",
    queries: ["highlife official", "{place} highlife"],
    regionQueries: {
      GH: ["ghana highlife official", "hiplife ghana"],
      NG: ["nigeria highlife official"],
    },
  },
  {
    slug: "reggae",
    name: "Reggae",
    emoji: "🟢",
    gradient: "linear-gradient(145deg,#86efac 0%,#22c55e 40%,#b91c1c 100%)",
    glow: "rgba(34,197,94,0.45)",
    queries: ["reggae official", "{place} reggae"],
  },
  {
    slug: "trap",
    name: "Trap",
    emoji: "🖤",
    gradient: "linear-gradient(145deg,#a1a1aa 0%,#52525b 50%,#18181b 100%)",
    glow: "rgba(113,113,122,0.55)",
    queries: ["trap music official", "{place} trap official"],
  },
  {
    slug: "indie",
    name: "Indie",
    emoji: "🌿",
    gradient: "linear-gradient(145deg,#99f6e4 0%,#14b8a6 50%,#115e59 100%)",
    glow: "rgba(20,184,166,0.45)",
    queries: ["indie music official", "{place} indie rock official"],
  },
  {
    slug: "k-pop",
    name: "K-pop",
    emoji: "💗",
    gradient: "linear-gradient(145deg,#fda4af 0%,#f43f5e 45%,#9f1239 100%)",
    glow: "rgba(244,63,94,0.5)",
    queries: ["kpop official mv", "{place} kpop"],
    regionQueries: {
      KR: ["kpop official mv 2026", "k hip hop official"],
    },
  },
  {
    slug: "jazz",
    name: "Jazz",
    emoji: "🎷",
    gradient: "linear-gradient(145deg,#fcd34d 0%,#d97706 50%,#78350f 100%)",
    glow: "rgba(217,119,6,0.5)",
    queries: ["jazz music official", "{place} jazz"],
  },
  {
    slug: "country",
    name: "Country",
    emoji: "🤠",
    gradient: "linear-gradient(145deg,#fdba74 0%,#ea580c 50%,#7c2d12 100%)",
    glow: "rgba(234,88,12,0.5)",
    queries: ["country music official", "{place} country songs"],
  },
  {
    slug: "classical",
    name: "Classical",
    emoji: "🎻",
    gradient: "linear-gradient(145deg,#e0e7ff 0%,#818cf8 50%,#3730a3 100%)",
    glow: "rgba(129,140,248,0.5)",
    queries: ["classical music performance", "orchestra official"],
  },
];

export function getGenre(slug: string): GenreDef | undefined {
  return GENRES.find((g) => g.slug === slug.toLowerCase());
}

export function genreQueries(genre: GenreDef, regionCode: string, regionName: string): string[] {
  const local = genre.regionQueries?.[regionCode] ?? [];
  const base = genre.queries.map((q) => q.replace(/\{place\}/gi, regionName));
  return [...local, ...base].slice(0, 5);
}
