/**
 * VerzZify Global Charts — industry Global 200 model, VerzZify catalog only.
 *
 * SEU = (paid downloads × 200) + hosted streams.
 * YouTube promotions never rank. D2C sales on VerzZify count.
 * No recurrent rule: a title stays as long as it still ranks.
 */
import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import type { ArtistCard, ChartArtistEntry, ChartBoard, ChartDelta, ChartTrackEntry, TrackCard } from "./types";

export const CHART_RULES = {
  saleWeight: 200,
  host: "Official VerzZify-hosted tracks only. YouTube promotions never rank here.",
  score: "SEU = (paid downloads × 200) + hosted streams.",
  window: "Friday–Thursday tracking week. Published Tuesday. Movement vs last week.",
} as const;

export const CHART_COUNTRIES = [
  { id: "global", label: "Global 200" },
  { id: "excl_us", label: "Excl. US" },
  { id: "US", label: "United States" },
  { id: "KR", label: "Korea" },
  { id: "JP", label: "Japan" },
  { id: "GB", label: "United Kingdom" },
  { id: "MX", label: "Mexico" },
  { id: "DE", label: "Germany" },
  { id: "NG", label: "Nigeria" },
  { id: "GH", label: "Ghana" },
  { id: "IN", label: "India" },
  { id: "ZA", label: "South Africa" },
  { id: "JM", label: "Jamaica" },
  { id: "LB", label: "Lebanon" },
  { id: "SN", label: "Senegal" },
  { id: "ML", label: "Mali" },
] as const;

export const CHART_GENRES = [
  { id: "all", label: "All genres" },
  { id: "pop", label: "Pop" },
  { id: "hiphop", label: "Hip Hop" },
  { id: "latin", label: "Latin" },
  { id: "electronic", label: "Electronic" },
  { id: "afrobeats", label: "Afrobeats" },
  { id: "rnb", label: "R&B" },
  { id: "indie", label: "Indie" },
] as const;

const GENRE_MAP: Record<string, string[]> = {
  pop: ["City Pop", "Electropop", "Indie Pop", "Pop"],
  hiphop: ["Hip Hop"],
  latin: ["Latin"],
  electronic: ["Electronic", "Techno", "Electropop"],
  afrobeats: ["Afrobeats", "Amapiano", "Highlife"],
  rnb: ["R&B", "Gospel"],
  indie: ["Indie", "Indie Pop", "Desert Blues", "Afro-fusion"],
};

const COUNTRY_IDS = new Set<string>(CHART_COUNTRIES.map((c) => c.id));

function movement(rank: number, previous: number | null): { delta: number | null; movement: ChartDelta } {
  if (previous == null) return { delta: null, movement: "new" };
  const d = previous - rank;
  if (d > 0) return { delta: d, movement: "up" };
  if (d < 0) return { delta: d, movement: "down" };
  return { delta: 0, movement: "same" };
}

function snapshotKey(kind: "tracks" | "artists", scope: string, genre: string | null): string {
  const g = genre && genre !== "all" ? genre : "all";
  return `${kind}:${scope}:${g}`;
}

function titleFor(kind: "tracks" | "artists", scope: string): { title: string; subtitle: string } {
  if (kind === "tracks" && scope === "global") {
    return { title: "VerzZify Global 200", subtitle: `${CHART_RULES.score} ${CHART_RULES.host}` };
  }
  if (kind === "tracks" && scope === "excl_us") {
    return { title: "Global Excl. US", subtitle: "Same SEU formula. United States streams and sales removed." };
  }
  if (kind === "artists" && scope === "global") {
    return { title: "VerzZify Artist 200", subtitle: `${CHART_RULES.score} Ranked by each artist's combined SEU.` };
  }
  if (kind === "artists" && scope === "excl_us") {
    return { title: "Artists Excl. US", subtitle: "Same SEU formula. United States artists removed." };
  }
  const country = CHART_COUNTRIES.find((c) => c.id === scope)?.label ?? "Global";
  const lane = kind === "artists" ? "Artists" : "200";
  return {
    title: `${country} ${lane}`,
    subtitle: `${CHART_RULES.score} ${CHART_RULES.host}`,
  };
}

type PrevRow = { position: number; peak: number | null; weeksOn: number | null };

function mapChartTrack(r: Record<string, unknown>): TrackCard {
  return {
    id: String(r.id),
    title: String(r.title),
    coverUrl: String(r.cover_url),
    audioUrl: String(r.audio_url),
    durationMs: Number(r.duration_ms) || 0,
    genre: r.genre ? String(r.genre) : null,
    distribution: String(r.distribution),
    priceCents: Number(r.price_cents) || 0,
    currency: String(r.currency ?? "USD"),
    playCount: Number(r.play_count) || 0,
    likeCount: Number(r.like_count) || 0,
    albumId: r.album_id ? String(r.album_id) : null,
    albumTitle: r.album_title ? String(r.album_title) : null,
    lyrics: null,
    explicit: Boolean(r.explicit),
    featuredArtists: null,
    producer: null,
    songwriter: null,
    copyrightOwner: null,
    country: r.country ? String(r.country) : null,
    artistId: String(r.artist_id),
    artistName: String(r.artist_name),
    artistSlug: String(r.artist_slug),
    artistAvatar: r.artist_avatar ? String(r.artist_avatar) : null,
    verified: r.verification_status === "verified",
  };
}

export const getCharts = createServerFn({ method: "GET" })
  .validator((d: { kind?: string; scope?: string; genre?: string }) => d)
  .handler(async ({ data }): Promise<ChartBoard> => {
    const kind = data.kind === "artists" ? "artists" : "tracks";
    const scope = data.scope && COUNTRY_IDS.has(data.scope) ? data.scope : "global";
    const genre = data.genre && data.genre !== "all" && GENRE_MAP[data.genre] ? data.genre : null;
    const sql = await getSql();
    const { title, subtitle } = titleFor(kind, scope);

    const snap = await sql<{ id: string }>`
      select id from chart_snapshots
      where chart_key = ${snapshotKey(kind, scope, genre)}
      order by captured_at desc limit 1
    `;
    const prev = new Map<string, PrevRow>();
    if (snap[0]) {
      const ranks = await sql<{ item_id: string; position: number; peak: number | null; weeks_on: number | null }>`
        select item_id, position, peak, weeks_on from chart_ranks where snapshot_id = ${snap[0].id}
      `;
      for (const r of ranks) {
        prev.set(r.item_id, { position: Number(r.position), peak: r.peak, weeksOn: r.weeks_on });
      }
    }

    const genreList = genre ? GENRE_MAP[genre] : null;
    let tracks: ChartTrackEntry[] = [];
    let artists: ChartArtistEntry[] = [];

    if (kind === "tracks") {
      const params: unknown[] = [];
      let where = "";
      if (scope === "excl_us") {
        where += ` and coalesce(t.country, '') <> 'US'`;
      } else if (scope !== "global") {
        params.push(scope);
        where += ` and t.country = $${params.length}`;
      }
      if (genreList) {
        const marks = genreList.map((_, i) => `$${params.length + i + 1}`).join(",");
        params.push(...genreList);
        where += ` and t.genre in (${marks})`;
      }
      const rows = await sql.query<Record<string, unknown>>(
        `select t.id, t.title, t.cover_url, t.audio_url, t.duration_ms, t.genre, t.distribution,
                t.price_cents, t.currency, t.play_count, t.like_count, t.album_id,
                al.title as album_title, t.explicit, t.country, a.user_id as artist_id,
                a.artist_name, p.username as artist_slug, p.avatar_url as artist_avatar,
                a.verification_status,
                coalesce(s.units, 0) as sales_units,
                (coalesce(s.units, 0) * 200 + t.play_count) as chart_points
         from tracks t
         join artist_profiles a on a.user_id = t.artist_id
         join profiles p on p.id = a.user_id
         left join albums al on al.id = t.album_id
         left join chart_download_units s on s.track_id = t.id
         where t.status = 'published' ${where}
         order by (coalesce(s.units, 0) * 200 + t.play_count) desc, t.play_count desc
         limit 200`,
        params,
      );
      tracks = rows.map((r, i) => {
        const rank = i + 1;
        const last = prev.get(String(r.id));
        const previousRank = last?.position ?? null;
        const peak = Math.min(rank, last?.peak ?? last?.position ?? rank);
        const weeksOn = (last?.weeksOn ?? 0) + 1;
        return {
          rank,
          previousRank,
          points: Number(r.chart_points) || 0,
          sales: Number(r.sales_units) || 0,
          peak,
          weeksOn,
          gainer: false,
          track: mapChartTrack(r),
          ...movement(rank, previousRank),
        };
      });
      let best = 0;
      let bestId = "";
      for (const e of tracks) {
        if (e.delta && e.delta > best) {
          best = e.delta;
          bestId = e.track.id;
        }
      }
      tracks = tracks.map((e) => (e.track.id === bestId && best > 0 ? { ...e, gainer: true } : e));
    } else {
      const artistParams: unknown[] = [];
      let artistWhere = "";
      if (scope === "excl_us") {
        artistWhere += ` and coalesce(p.country, '') <> 'US'`;
      } else if (scope !== "global") {
        artistParams.push(scope);
        artistWhere += ` and p.country = $1`;
      }
      if (genreList) {
        const marks = genreList.map((_, i) => `$${artistParams.length + i + 1}`).join(",");
        artistParams.push(...genreList);
        artistWhere += ` and a.genres in (${marks})`;
      }
      const rows = await sql.query<Record<string, unknown>>(
        `select p.id, p.username as slug, a.artist_name as name, p.avatar_url, p.banner_url,
                p.country, p.city, a.biography as bio, a.genres, a.verification_status,
                a.monthly_listeners, p.role,
                (select count(*) from follows f where f.following_id = p.id) as followers,
                coalesce((
                  select sum(t.play_count + coalesce(s.units, 0) * 200)
                  from tracks t
                  left join chart_download_units s on s.track_id = t.id
                  where t.artist_id = p.id and t.status = 'published'
                ), 0) as chart_points
         from artist_profiles a
         join profiles p on p.id = a.user_id
         where 1=1 ${artistWhere}
         order by chart_points desc, a.monthly_listeners desc
         limit 200`,
        artistParams,
      );
      artists = rows.map((r, i) => {
        const artist: ArtistCard = {
          id: String(r.id),
          slug: String(r.slug),
          name: String(r.name),
          avatarUrl: (r.avatar_url as string) ?? null,
          bannerUrl: (r.banner_url as string) ?? null,
          country: (r.country as string) ?? null,
          city: (r.city as string) ?? null,
          bio: (r.bio as string) ?? null,
          genres: (r.genres as string) ?? null,
          verified: r.verification_status === "verified",
          monthlyListeners: Number(r.monthly_listeners) || 0,
          followers: Number(r.followers) || 0,
          role: String(r.role ?? "artist"),
        };
        const rank = i + 1;
        const last = prev.get(artist.id);
        const previousRank = last?.position ?? null;
        return {
          rank,
          previousRank,
          points: Number(r.chart_points) || 0,
          peak: Math.min(rank, last?.peak ?? last?.position ?? rank),
          weeksOn: (last?.weeksOn ?? 0) + 1,
          artist,
          ...movement(rank, previousRank),
        };
      });
    }

    return {
      kind,
      scope,
      genre,
      title,
      subtitle,
      updatedLabel: "Week of 22 Aug 2026 · Fri–Thu tracking · published Tuesday",
      tracks,
      artists,
      countries: [...CHART_COUNTRIES],
      genres: [...CHART_GENRES],
    };
  });
