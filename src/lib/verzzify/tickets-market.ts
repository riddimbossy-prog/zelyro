import { createServerFn } from "@tanstack/react-start";
import { REGION_NAMES, normalizeRegion } from "./yt-charts";
import { eventsKeyConfigured, fetchConcertsByArtist, fetchConcertsByLocation, type RapidConcert } from "./rapid-events";

export type MarketTicket = RapidConcert & {
  scope: "local" | "global";
  popular: boolean;
};

const COUNTRY_CITIES: Record<string, string[]> = {
  GH: ["Accra", "Kumasi"],
  NG: ["Lagos", "Abuja"],
  CI: ["Abidjan"],
  SN: ["Dakar"],
  ZA: ["Johannesburg", "Cape Town"],
  KE: ["Nairobi"],
  JM: ["Kingston"],
  US: ["New York", "Los Angeles"],
  GB: ["London", "Manchester"],
  FR: ["Paris"],
  DE: ["Berlin"],
  BR: ["São Paulo"],
  MX: ["Mexico City"],
  CA: ["Toronto"],
  AU: ["Sydney"],
  IN: ["Mumbai"],
  JP: ["Tokyo"],
  KR: ["Seoul"],
  AE: ["Dubai"],
};

const GLOBAL_STARS = [
  "taylor swift",
  "beyonce",
  "beyoncé",
  "drake",
  "the weeknd",
  "bad bunny",
  "coldplay",
  "ed sheeran",
  "burna boy",
  "wizkid",
  "davido",
  "blackpink",
  "bts",
  "adele",
  "rihanna",
  "harry styles",
  "dua lipa",
  "sza",
  "kendrick",
  "travis scott",
  "shakira",
  "rema",
  "tems",
  "black sherif",
  "sarkodie",
  "magic system",
  "alpha blondy",
];

const MEGA_VENUE = /stadium|arena|dome|park|centre|center|forum|garden|bowl|coliseum|o2|msg/i;

const cache = new Map<string, { at: number; data: TicketMarket }>();
const byId = new Map<string, MarketTicket>();
const TTL = 30 * 60 * 1000;

function isPopular(ev: RapidConcert) {
  const blob = `${ev.title} ${ev.artist} ${ev.venue}`.toLowerCase();
  return GLOBAL_STARS.some((s) => blob.includes(s)) || MEGA_VENUE.test(ev.venue);
}

function tag(ev: RapidConcert, scope: "local" | "global"): MarketTicket {
  const row = { ...ev, scope, popular: isPopular(ev) };
  byId.set(row.id, row);
  return row;
}

function fallback(region: string): MarketTicket[] {
  const city = COUNTRY_CITIES[region]?.[0] ?? "Accra";
  const country = REGION_NAMES[region] ?? region;
  const mk = (id: string, title: string, artist: string, venue: string, when: string, popular: boolean, scope: "local" | "global"): MarketTicket => {
    const row: MarketTicket = {
      id: `rap_${id}`,
      title,
      artist,
      venue,
      city,
      country,
      startsAt: when,
      posterUrl: "/events/rooftop.jpg",
      ticketUrl: null,
      scope,
      popular,
    };
    byId.set(row.id, row);
    return row;
  };
  const soon = (d: number) => new Date(Date.now() + d * 86400000).toISOString();
  if (region === "CI") {
    return [
      mk("ci-ms", "Magic System live", "Magic System", "Palais de la Culture", soon(12), true, "local"),
      mk("ci-ab", "Alpha Blondy · Cocody night", "Alpha Blondy", "Stade Félix Houphouët-Boigny", soon(24), true, "local"),
    ];
  }
  if (region === "NG") {
    return [
      mk("ng-bb", "Burna Boy stadium date", "Burna Boy", "Teslim Balogun Stadium", soon(18), true, "local"),
      mk("ng-wk", "Wizkid in Lagos", "Wizkid", "Tafawa Balewa Square", soon(30), true, "local"),
    ];
  }
  return [
    mk("gh-bs", "Black Sherif live in Accra", "Black Sherif", "Accra Sports Stadium", soon(14), true, "local"),
    mk("gh-sk", "Sarkodie · No Limit", "Sarkodie", "National Theatre", soon(21), true, "local"),
  ];
}

const GLOBAL_FALLBACK: MarketTicket[] = [
  {
    id: "rap_global-swift",
    title: "Taylor Swift · Eras",
    artist: "Taylor Swift",
    venue: "Wembley Stadium",
    city: "London",
    country: "United Kingdom",
    startsAt: new Date(Date.now() + 40 * 86400000).toISOString(),
    posterUrl: "/events/rooftop.jpg",
    ticketUrl: null,
    scope: "global",
    popular: true,
  },
  {
    id: "rap_global-burna",
    title: "Burna Boy · I Told Them tour",
    artist: "Burna Boy",
    venue: "Madison Square Garden",
    city: "New York",
    country: "United States",
    startsAt: new Date(Date.now() + 28 * 86400000).toISOString(),
    posterUrl: "/events/rooftop.jpg",
    ticketUrl: null,
    scope: "global",
    popular: true,
  },
  {
    id: "rap_global-coldplay",
    title: "Coldplay · Music of the Spheres",
    artist: "Coldplay",
    venue: "Estádio do Morumbi",
    city: "São Paulo",
    country: "Brazil",
    startsAt: new Date(Date.now() + 55 * 86400000).toISOString(),
    posterUrl: "/events/rooftop.jpg",
    ticketUrl: null,
    scope: "global",
    popular: true,
  },
];

for (const g of GLOBAL_FALLBACK) byId.set(g.id, g);

export type TicketMarket = {
  region: string;
  regionName: string;
  live: boolean;
  local: MarketTicket[];
  global: MarketTicket[];
};

export async function loadTicketMarket(region: string): Promise<TicketMarket> {
  const code = normalizeRegion(region);
  const hit = cache.get(code);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const regionName = REGION_NAMES[code] ?? code;
  let local: MarketTicket[] = [];
  let global: MarketTicket[] = [];
  if (eventsKeyConfigured()) {
    const cities = COUNTRY_CITIES[code] ?? [regionName];
    const localRaw = (
      await Promise.all(
        cities.slice(0, 2).map(async (city) => {
          try {
            return await fetchConcertsByLocation(city, code);
          } catch {
            return [];
          }
        }),
      )
    ).flat();
    const seen = new Set<string>();
    local = localRaw
      .filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      })
      .map((e) => tag(e, "local"));

    const stars = GLOBAL_STARS.slice(0, 8);
    const globalRaw = (
      await Promise.all(
        stars.map(async (name) => {
          try {
            return await fetchConcertsByArtist(name);
          } catch {
            return [];
          }
        }),
      )
    ).flat();
    const gSeen = new Set<string>();
    global = globalRaw
      .map((e) => tag(e, "global"))
      .filter((e) => e.popular)
      .filter((e) => {
        if (gSeen.has(e.id)) return false;
        gSeen.add(e.id);
        return true;
      })
      .slice(0, 24);
  }
  if (!local.length) local = fallback(code);
  if (!global.length) global = GLOBAL_FALLBACK;
  const data: TicketMarket = { region: code, regionName, live: eventsKeyConfigured(), local, global };
  cache.set(code, { at: Date.now(), data });
  return data;
}

export function getMarketTicket(id: string): MarketTicket | null {
  return byId.get(id) ?? null;
}

export const getTicketMarket = createServerFn({ method: "GET" })
  .validator((region: string) => normalizeRegion(region || "GH"))
  .handler(async ({ data: region }) => loadTicketMarket(region));
