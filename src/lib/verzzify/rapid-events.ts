import { rapidKey } from "./rapid-yt";

const HOST = process.env.RAPIDAPI_EVENTS_HOST?.trim() || "concerts-artists-events-tracker.p.rapidapi.com";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
}

function pickList(json: unknown): Record<string, unknown>[] {
  if (Array.isArray(json)) return json.filter((x) => x && typeof x === "object") as Record<string, unknown>[];
  const o = asRecord(json);
  if (!o) return [];
  for (const k of ["data", "events", "results", "concerts", "items"]) {
    const v = o[k];
    if (Array.isArray(v)) return v.filter((x) => x && typeof x === "object") as Record<string, unknown>[];
  }
  return [];
}

export type RapidConcert = {
  id: string;
  title: string;
  artist: string;
  venue: string;
  city: string;
  country: string;
  startsAt: string;
  posterUrl: string;
  ticketUrl: string | null;
};

function slugId(parts: string[]) {
  const raw = parts.join("|").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
  return `rap_${raw || "event"}`;
}

export function mapConcert(raw: Record<string, unknown>, fallbackCountry: string): RapidConcert | null {
  const nested = asRecord(raw.venue) ?? asRecord(raw.location) ?? {};
  const artist =
    str(raw.artist, raw.artistName, asRecord(raw.artist)?.name, raw.performer, raw.name) ||
    str(raw.title).split(" at ")[0] ||
    str(raw.title).split(" - ")[0];
  const title = str(raw.title, raw.name, raw.eventName, artist);
  if (!title) return null;
  const venue = str(raw.venue, nested.name, raw.place, raw.locationName);
  const locLine = str(raw.location, raw.city, nested.city, nested.address, raw.place);
  const city = str(raw.city, nested.city, locLine.split(",")[0]);
  const country = str(raw.country, nested.country, fallbackCountry);
  const startsAt =
    str(raw.date, raw.startDate, raw.datetime, raw.starts_at, raw.start_date) || new Date().toISOString();
  const poster =
    str(raw.image, raw.img, raw.thumbnail, raw.poster, raw.imageUrl, asRecord(raw.image)?.url) ||
    "/events/rooftop.jpg";
  const ticket = str(raw.link, raw.url, raw.ticket, raw.ticketUrl, raw.tickets, asRecord(raw.offer)?.url) || null;
  return {
    id: slugId([title, city, startsAt.slice(0, 10)]),
    title,
    artist: artist || title,
    venue: venue || city || "Venue TBA",
    city: city || REGION_CITY_FALLBACK[fallbackCountry] || fallbackCountry,
    country,
    startsAt,
    posterUrl: poster,
    ticketUrl: ticket,
  };
}

const REGION_CITY_FALLBACK: Record<string, string> = {
  GH: "Accra",
  NG: "Lagos",
  CI: "Abidjan",
  US: "New York",
  GB: "London",
};

async function rapidGet(path: string, query: Record<string, string>): Promise<unknown> {
  const key = rapidKey();
  if (!key) throw new Error("RAPIDAPI_KEY is not set");
  const url = new URL(`https://${HOST}${path}`);
  for (const [k, v] of Object.entries(query)) if (v) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": key,
      "x-rapidapi-host": HOST,
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`events API ${res.status}`);
  return res.json();
}

function dateWindow() {
  const min = new Date();
  const max = new Date();
  max.setDate(max.getDate() + 120);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { minDate: iso(min), maxDate: iso(max) };
}

export async function fetchConcertsByLocation(place: string, country: string): Promise<RapidConcert[]> {
  const { minDate, maxDate } = dateWindow();
  const json = await rapidGet("/location", { name: place, minDate, maxDate, page: "1" });
  return pickList(json)
    .map((row) => mapConcert(row, country))
    .filter((x): x is RapidConcert => Boolean(x));
}

export async function fetchConcertsByArtist(artist: string, country = "US"): Promise<RapidConcert[]> {
  const json = await rapidGet("/artist", { name: artist, page: "1" });
  return pickList(json)
    .map((row) => mapConcert(row, country))
    .filter((x): x is RapidConcert => Boolean(x));
}

export function eventsKeyConfigured() {
  return Boolean(rapidKey());
}
