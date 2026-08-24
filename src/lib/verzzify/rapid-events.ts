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

function firstImage(v: unknown): string {
  if (typeof v === "string" && /^https?:\/\//.test(v)) return v;
  const o = asRecord(v);
  if (o) {
    const nested = str(o.url, o.src, o.image, o.medium, o.large, o.original);
    if (/^https?:\/\//.test(nested)) return nested;
  }
  if (Array.isArray(v)) {
    for (const item of v) {
      const found = firstImage(item);
      if (found) return found;
    }
  }
  return "";
}

export function pickList(json: unknown): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const seen = new Set<unknown>();
  const looks = (o: Record<string, unknown>) =>
    Boolean(o.name || o.title || o.artist || o.venue || o.starts_at || o.startDate || o.date || o.datetime || o.artist_id);
  const walk = (v: unknown, depth: number) => {
    if (v == null || depth > 5 || seen.has(v)) return;
    if (typeof v === "object") seen.add(v);
    if (Array.isArray(v)) {
      for (const x of v) {
        const rec = asRecord(x);
        if (rec && looks(rec)) out.push(rec);
        else walk(x, depth + 1);
      }
      return;
    }
    const o = asRecord(v);
    if (!o) return;
    if (looks(o) && (o.venue || o.starts_at || o.date || o.city || o.location)) out.push(o);
    for (const k of ["data", "events", "results", "concerts", "items", "hits", "response"]) walk(o[k], depth + 1);
  };
  walk(json, 0);
  return out;
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
  const raw = parts.join("|").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return `rap_${raw || "event"}`;
}

export function mapConcert(raw: Record<string, unknown>, fallbackCountry: string): RapidConcert | null {
  const venueObj = asRecord(raw.venue) ?? asRecord(raw.location) ?? {};
  const artistObj = asRecord(raw.artist) ?? asRecord(raw.performer) ?? asRecord(Array.isArray(raw.performers) ? raw.performers[0] : null) ?? {};
  const artist =
    str(artistObj.name, raw.artist, raw.artistName, raw.performer, raw.primary_performer) ||
    str(raw.title, raw.name).split(/\s+(?:at|@|–|-)\s+/i)[0];
  const title = str(raw.title, raw.name, raw.event_name, raw.eventName, artist);
  if (!title) return null;
  const venue = str(venueObj.name, raw.venue, raw.place, raw.locationName);
  const locLine = str(raw.location, raw.city, venueObj.city, venueObj.address, asRecord(venueObj.location)?.city);
  const city = str(raw.city, venueObj.city, asRecord(venueObj.city)?.name, locLine.split(",")[0]);
  const country = str(raw.country, venueObj.country, asRecord(venueObj.country)?.name, fallbackCountry);
  const startsAt =
    str(
      raw.starts_at,
      raw.startDate,
      raw.datetime,
      raw.date,
      raw.startsAt,
      raw.start_date,
      asRecord(raw.datetime)?.iso,
    ) || new Date().toISOString();
  const poster =
    firstImage(raw.image) ||
    firstImage(raw.images) ||
    firstImage(raw.poster) ||
    firstImage(raw.thumbnail) ||
    firstImage(artistObj.image) ||
    firstImage(artistObj.images) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(artist || title)}&size=400&background=12081c&color=f3e8ff`;
  const ticket =
    str(
      raw.ticket_url,
      raw.ticketUrl,
      raw.tickets_url,
      raw.url,
      raw.link,
      raw.tickets,
      asRecord(raw.offer)?.url,
      asRecord(Array.isArray(raw.offers) ? raw.offers[0] : null)?.url,
    ) || null;
  const id = str(raw.id, raw.event_id, raw._id) || slugId([title, city, startsAt.slice(0, 10)]);
  return {
    id: id.startsWith("rap_") ? id : `rap_${id}`,
    title,
    artist: artist || title,
    venue: venue || city || "Venue TBA",
    city: city || fallbackCountry,
    country,
    startsAt,
    posterUrl: poster,
    ticketUrl: ticket && /^https?:\/\//.test(ticket) ? ticket : ticket,
  };
}

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
    signal: AbortSignal.timeout(10000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`events ${path} ${res.status}: ${text.slice(0, 180)}`);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`events ${path} invalid JSON`);
  }
}

export async function searchEvents(params: Record<string, string>, country: string): Promise<RapidConcert[]> {
  const json = await rapidGet("/search", { page: "1", ...params });
  const mapped = pickList(json)
    .map((row) => mapConcert(row, country))
    .filter((x): x is RapidConcert => Boolean(x));
  if (mapped.length) return mapped;
  const blob = JSON.stringify(json);
  if (blob.length > 8 && blob !== "{}" && blob !== "[]") {
    const rec = asRecord(json);
    if (rec && (rec.message || rec.error || rec.Message)) {
      throw new Error(str(rec.message, rec.error, rec.Message));
    }
  }
  return [];
}

export async function fetchArtistId(name: string): Promise<string | null> {
  const json = await rapidGet("/search", { keyword: name, types: "artist", page: "1" });
  const row = pickList(json)[0] ?? asRecord(json);
  if (!row) return null;
  return str(row.artist_id, row.id, asRecord(row.artist)?.id) || null;
}

export async function fetchConcertsByArtist(artist: string, country = "US"): Promise<RapidConcert[]> {
  try {
    const id = await fetchArtistId(artist);
    if (id) {
      const json = await rapidGet("/artist/events", { artist_id: id });
      const mapped = pickList(json)
        .map((row) => mapConcert(row, country))
        .filter((x): x is RapidConcert => Boolean(x));
      if (mapped.length) return mapped;
    }
  } catch {
    /* keyword fallback */
  }
  return searchEvents({ keyword: artist, types: "event", sort: "date" }, country);
}

export function eventsKeyConfigured() {
  return Boolean(rapidKey());
}
