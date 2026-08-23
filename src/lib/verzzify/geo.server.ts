import { getRequest } from "@tanstack/react-start/server";
import { normalizeRegion, REGION_NAMES } from "./yt-charts";
import type { ViewerGeo } from "./geo";

const COUNTRY_HEADERS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "cloudfront-viewer-country",
  "x-country-code",
  "x-appengine-country",
];

function header(h: Headers, name: string) {
  return h.get(name) ?? h.get(name.toLowerCase());
}

function isPublicIp(ip: string) {
  if (!ip) return false;
  if (ip === "127.0.0.1" || ip === "::1") return false;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("127.")) return false;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return false;
  return true;
}

function clientIp(h: Headers): string | null {
  const xff = header(h, "x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.replace(/^::ffff:/, "");
  }
  const real = header(h, "x-real-ip") ?? header(h, "true-client-ip");
  return real ? real.replace(/^::ffff:/, "") : null;
}

function fromLanguage(h: Headers): string | null {
  const lang = header(h, "accept-language");
  if (!lang) return null;
  const m = lang.match(/^[a-zA-Z]{2,3}[-_]([A-Z]{2})/);
  return m?.[1] ?? null;
}

async function lookupIp(ip: string): Promise<{ region: string; city: string | null } | null> {
  const ctrl = AbortSignal.timeout(2500);
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country_code,city`, {
      signal: ctrl,
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; country_code?: string; city?: string };
    if (json.success === false || !json.country_code) return null;
    return { region: json.country_code, city: json.city ?? null };
  } catch {
    return null;
  }
}

export async function detectViewerGeo(): Promise<ViewerGeo> {
  let headers: Headers | null = null;
  try {
    headers = getRequest().headers;
  } catch {
    headers = null;
  }

  if (headers) {
    for (const key of COUNTRY_HEADERS) {
      const raw = header(headers, key);
      if (raw && raw.length === 2 && raw !== "XX" && raw !== "T1") {
        const region = normalizeRegion(raw);
        return { region, regionName: REGION_NAMES[region] ?? raw.toUpperCase(), city: null, source: "header" };
      }
    }
    const ip = clientIp(headers);
    if (ip && isPublicIp(ip)) {
      const geo = await lookupIp(ip);
      if (geo) {
        const region = normalizeRegion(geo.region);
        return {
          region,
          regionName: REGION_NAMES[region] ?? geo.region.toUpperCase(),
          city: geo.city,
          source: "ip",
        };
      }
    }
    const lang = fromLanguage(headers);
    if (lang) {
      const region = normalizeRegion(lang);
      return { region, regionName: REGION_NAMES[region] ?? region, city: null, source: "language" };
    }
  }

  return { region: "US", regionName: REGION_NAMES.US, city: null, source: "default" };
}
