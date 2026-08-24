import { createServerFn } from "@tanstack/react-start";
import { REGION_NAMES, normalizeRegion } from "./yt-charts";
import { eventsKeyConfigured, type RapidConcert } from "./rapid-events";
import { searchGoogleEvents, searchTicketmaster, ticketmasterConfigured } from "./ticket-sources";

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

const CITY_GEO: Record<string, { lat: string; lng: string }> = {
  Accra: { lat: "5.6037", lng: "-0.1870" },
  Kumasi: { lat: "6.6885", lng: "-1.6244" },
  Lagos: { lat: "6.5244", lng: "3.3792" },
  Abuja: { lat: "9.0765", lng: "7.3986" },
  Abidjan: { lat: "5.3600", lng: "-4.0083" },
  Dakar: { lat: "14.7167", lng: "-17.4677" },
  Johannesburg: { lat: "-26.2041", lng: "28.0473" },
  "Cape Town": { lat: "-33.9249", lng: "18.4241" },
  Nairobi: { lat: "-1.2921", lng: "36.8219" },
  Kingston: { lat: "17.9714", lng: "-76.7931" },
  "New York": { lat: "40.7128", lng: "-74.0060" },
  "Los Angeles": { lat: "34.0522", lng: "-118.2437" },
  London: { lat: "51.5074", lng: "-0.1278" },
  Manchester: { lat: "53.4808", lng: "-2.2426" },
  Paris: { lat: "48.8566", lng: "2.3522" },
  Berlin: { lat: "52.5200", lng: "13.4050" },
  "São Paulo": { lat: "-23.5505", lng: "-46.6333" },
  "Mexico City": { lat: "19.4326", lng: "-99.1332" },
  Toronto: { lat: "43.6532", lng: "-79.3832" },
  Sydney: { lat: "-33.8688", lng: "151.2093" },
  Mumbai: { lat: "19.0760", lng: "72.8777" },
  Tokyo: { lat: "35.6762", lng: "139.6503" },
  Seoul: { lat: "37.5665", lng: "126.9780" },
  Dubai: { lat: "25.2048", lng: "55.2708" },
};

function dedupe(rows: RapidConcert[], scope: "local" | "global"): MarketTicket[] {
  const seen = new Set<string>();
  const out: MarketTicket[] = [];
  for (const e of rows) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(tag(e, scope));
  }
  return out;
}

async function localFor(code: string, errors: string[]): Promise<RapidConcert[]> {
  const city = COUNTRY_CITIES[code]?.[0] ?? REGION_NAMES[code] ?? code;
  const countryName = REGION_NAMES[code] ?? code;
  const out: RapidConcert[] = [];
  try {
    out.push(...(await searchGoogleEvents(`concerts in ${city}`, code)));
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "google-events local failed");
  }
  if (!out.length && ticketmasterConfigured()) {
    try {
      out.push(...(await searchTicketmaster({ countryCode: code, city })));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "ticketmaster local failed");
    }
  }
  if (!out.length) {
    try {
      out.push(...(await searchGoogleEvents(`concerts in ${countryName}`, code)));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "google-events country failed");
    }
  }
  return out;
}

async function globalPopular(errors: string[]): Promise<RapidConcert[]> {
  const out: RapidConcert[] = [];
  if (ticketmasterConfigured()) {
    try {
      out.push(...(await searchTicketmaster({ countryCode: "US" })));
      if (out.length < 8) out.push(...(await searchTicketmaster({ countryCode: "GB" })));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "ticketmaster global failed");
    }
  }
  if (out.length < 6) {
    try {
      out.push(...(await searchGoogleEvents("popular stadium concerts in London", "GB")));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "google-events global failed");
    }
  }
  return out;
}

const cache = new Map<string, { at: number; data: TicketMarket }>();
const byId = new Map<string, MarketTicket>();
const TTL = 30 * 60 * 1000;

const MEGA_VENUE = /stadium|arena|dome|park|centre|center|forum|garden|bowl|coliseum|o2|msg/i;

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
  error?: string;
};

export async function loadTicketMarket(region: string): Promise<TicketMarket> {
  const code = normalizeRegion(region);
  const hit = cache.get(code);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const regionName = REGION_NAMES[code] ?? code;
  let error: string | undefined;
  let local: MarketTicket[] = [];
  let global: MarketTicket[] = [];
  const live = eventsKeyConfigured() || ticketmasterConfigured();
  const errors: string[] = [];
  if (live) {
    try {
      local = dedupe(await localFor(code, errors), "local");
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "local concerts failed");
    }
    try {
      const rows = dedupe(await globalPopular(errors), "global").slice(0, 24).map((t) => {
        const row = { ...t, popular: true as const };
        byId.set(row.id, row);
        return row;
      });
      global = rows;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "global concerts failed");
    }
    error = errors[0];
  } else {
    local = fallback(code);
    global = GLOBAL_FALLBACK;
    error = "RAPIDAPI_KEY is not set on the server";
  }
  const data: TicketMarket = { region: code, regionName, live, local, global, error };
  if (local.length || global.length) cache.set(code, { at: Date.now(), data });
  return data;
}

export function getMarketTicket(id: string): MarketTicket | null {
  return byId.get(id) ?? null;
}

export const getTicketMarket = createServerFn({ method: "GET" })
  .validator((region: string) => normalizeRegion(region || "GH"))
  .handler(async ({ data: region }) => loadTicketMarket(region));
