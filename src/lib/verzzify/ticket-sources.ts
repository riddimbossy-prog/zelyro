import { rapidKey } from "./rapid-yt";
import { mapConcert, pickList, type RapidConcert } from "./rapid-events";

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

const GOOGLE_HOST =
  process.env.RAPIDAPI_EVENTS_SEARCH_HOST?.trim() || "real-time-events-search.p.rapidapi.com";

/** Google Events via RapidAPI Real-Time Events Search — works for Accra and worldwide. */
export async function searchGoogleEvents(query: string, country: string): Promise<RapidConcert[]> {
  const key = rapidKey();
  if (!key) throw new Error("RAPIDAPI_KEY is not set");
  const url = new URL(`https://${GOOGLE_HOST}/search-events`);
  url.searchParams.set("query", query);
  url.searchParams.set("date", "month");
  url.searchParams.set("is_virtual", "false");
  url.searchParams.set("start", "0");
  const res = await fetch(url, {
    headers: { "x-rapidapi-key": key, "x-rapidapi-host": GOOGLE_HOST },
    signal: AbortSignal.timeout(10000),
  });
  const text = await res.text();
  if (res.status === 429) throw new Error("Google Events RapidAPI quota exceeded");
  if (!res.ok) throw new Error(`google-events ${res.status}: ${text.slice(0, 180)}`);
  const json = JSON.parse(text) as unknown;
  const rows = pickList(json);
  const mapped = rows
    .map((raw) => {
      const venue = asRecord(raw.venue) ?? {};
      const tickets = Array.isArray(raw.ticket_links) ? raw.ticket_links : [];
      const ticket = str(
        asRecord(tickets[0] as unknown)?.link,
        asRecord(tickets[0] as unknown)?.url,
        raw.link,
        raw.ticket_link,
      );
      return mapConcert(
        {
          ...raw,
          title: str(raw.name, raw.title),
          venue: str(venue.name, raw.venue),
          city: str(venue.city, asRecord(venue.full_address)?.city, raw.city),
          country: str(venue.country, country),
          date: str(raw.start_time, raw.date, raw.start_date),
          image: raw.thumbnail ?? raw.image ?? raw.photo,
          url: ticket || str(raw.link),
        },
        country,
      );
    })
    .filter((x): x is RapidConcert => Boolean(x));
  return mapped;
}

export function ticketmasterConfigured() {
  return Boolean(process.env.TICKETMASTER_API_KEY?.trim());
}

/** Ticketmaster Discovery — real buy links. Strong US/EU/ZA/KE; weak in Ghana. */
export async function searchTicketmaster(opts: {
  countryCode?: string;
  city?: string;
  keyword?: string;
}): Promise<RapidConcert[]> {
  const key = process.env.TICKETMASTER_API_KEY?.trim();
  if (!key) throw new Error("TICKETMASTER_API_KEY is not set");
  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", key);
  url.searchParams.set("classificationName", "music");
  url.searchParams.set("size", "20");
  url.searchParams.set("sort", "date,asc");
  if (opts.countryCode) url.searchParams.set("countryCode", opts.countryCode);
  if (opts.city) url.searchParams.set("city", opts.city);
  if (opts.keyword) url.searchParams.set("keyword", opts.keyword);
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error(`ticketmaster ${res.status}: ${JSON.stringify(json).slice(0, 160)}`);
  const embedded = asRecord(json._embedded);
  const events = Array.isArray(embedded?.events) ? (embedded!.events as Record<string, unknown>[]) : [];
  return events
    .map((ev) => {
      const venue = asRecord((asRecord(ev._embedded)?.venues as unknown[] | undefined)?.[0]) ?? {};
      const city = asRecord(venue.city);
      const country = asRecord(venue.country);
      const dates = asRecord(asRecord(ev.dates)?.start);
      const images = Array.isArray(ev.images) ? ev.images : [];
      const img = asRecord(images[0]);
      return mapConcert(
        {
          id: str(ev.id),
          title: str(ev.name),
          venue: str(venue.name),
          city: str(city?.name, opts.city),
          country: str(country?.countryCode, opts.countryCode),
          date: str(dates?.dateTime, dates?.localDate),
          image: str(img?.url),
          url: str(ev.url),
        },
        opts.countryCode || "US",
      );
    })
    .filter((x): x is RapidConcert => Boolean(x));
}
