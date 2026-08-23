import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type {
  AlbumCard,
  ArtistCard,
  EventCard,
  LedgerRow,
  LiveCard,
  MackProfileData,
  PlaylistCard,
  PostCard,
  TicketType,
  TrackCard,
  WalletSnapshot,
  YouTubePromotion,
} from "./types";
import { loadActivePromotions, loadArtistYoutube, loadNearby, searchYoutubeCatalog } from "./promotions";
import { loadYoutubeHome, normalizeRegion } from "./yt-charts";
import { detectViewerGeo } from "./geo.server";

type TrackRow = {
  id: string;
  title: string;
  cover_url: string;
  audio_url: string;
  duration_ms: number;
  genre: string | null;
  distribution: string;
  price_cents: number;
  currency: string;
  play_count: number;
  like_count: number;
  album_id: string | null;
  album_title: string | null;
  lyrics: string | null;
  explicit: boolean;
  featured_artists: string | null;
  producer: string | null;
  songwriter: string | null;
  copyright_owner: string | null;
  country: string | null;
  artist_id: string;
  artist_name: string;
  artist_slug: string;
  artist_avatar: string | null;
  verification_status: string;
};

function iso(v: unknown): string {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function mapTrack(r: TrackRow, extra?: { liked?: boolean; purchased?: boolean }): TrackCard {
  return {
    id: r.id,
    title: r.title,
    coverUrl: r.cover_url,
    audioUrl: r.audio_url,
    durationMs: Number(r.duration_ms) || 0,
    genre: r.genre,
    distribution: r.distribution,
    priceCents: Number(r.price_cents) || 0,
    currency: r.currency,
    playCount: Number(r.play_count) || 0,
    likeCount: Number(r.like_count) || 0,
    albumId: r.album_id,
    albumTitle: r.album_title,
    lyrics: r.lyrics,
    explicit: Boolean(r.explicit),
    featuredArtists: r.featured_artists,
    producer: r.producer,
    songwriter: r.songwriter,
    copyrightOwner: r.copyright_owner,
    country: r.country,
    artistId: r.artist_id,
    artistName: r.artist_name,
    artistSlug: r.artist_slug,
    artistAvatar: r.artist_avatar,
    verified: r.verification_status === "verified",
    liked: extra?.liked,
    purchased: extra?.purchased,
  };
}

const TRACK_FROM = `
  from tracks t
  join artist_profiles a on a.user_id = t.artist_id
  join profiles p on p.id = a.user_id
  left join albums al on al.id = t.album_id
`;

const TRACK_COLS = `
  t.id, t.title, t.cover_url, t.audio_url, t.duration_ms, t.genre, t.distribution,
  t.price_cents, t.currency, t.play_count, t.like_count, t.album_id,
  al.title as album_title, t.lyrics, t.explicit, t.featured_artists, t.producer,
  t.songwriter, t.copyright_owner, t.country, a.user_id as artist_id,
  a.artist_name, p.username as artist_slug, p.avatar_url as artist_avatar,
  a.verification_status
`;

async function optionalUserId(): Promise<string | null> {
  try {
    const { requireUserId, getSessionUser } = await import("@/lib/auth/verify.server");
    try {
      return await requireUserId();
    } catch {
      const u = await getSessionUser();
      return u?.id ?? null;
    }
  } catch {
    return null;
  }
}

export async function ensureProfile(
  userId: string,
  name: string | null,
  email: string | null,
  image: string | null,
): Promise<void> {
  const sql = await getSql();
  const existing = await sql<{ id: string }>`select id from profiles where id = ${userId} limit 1`;
  if (existing[0]) return;
  const base =
    (name || email || "listener")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 16) || "listener";
  let username = base;
  for (let i = 0; i < 8; i++) {
    const clash = await sql<{ id: string }>`select id from profiles where username = ${username} limit 1`;
    if (!clash[0]) break;
    username = `${base}${Math.floor(Math.random() * 90 + 10)}`;
  }
  await sql`
    insert into profiles (id, username, display_name, role, avatar_url)
    values (${userId}, ${username}, ${name || "Listener"}, 'fan', ${image})
  `;
  await sql`insert into wallets (user_id, currency) values (${userId}, 'USD')`;
  await sql`
    insert into playlists (id, user_id, title, is_public, is_system, kind)
    values
      (${`pl_liked_${userId}`}, ${userId}, 'Liked Songs', false, true, 'liked'),
      (${`pl_purchased_${userId}`}, ${userId}, 'Purchased', false, true, 'purchased')
  `;
}

async function decorate(tracks: TrackCard[], userId: string | null): Promise<TrackCard[]> {
  if (!userId || tracks.length === 0) return tracks;
  const sql = await getSql();
  const ids = tracks.map((t) => t.id);
  const likes = await sql.query<{ target_id: string }>(
    `select target_id from favorites
     where user_id = $1 and target_type = 'track' and target_id in (${ids.map((_, i) => `$${i + 2}`).join(",")})`,
    [userId, ...ids],
  );
  const bought = await sql.query<{ item_id: string }>(
    `select pi.item_id from purchase_items pi
     join purchases p on p.id = pi.purchase_id
     where p.buyer_id = $1 and p.status = 'completed' and pi.item_type = 'track'
       and pi.item_id in (${ids.map((_, i) => `$${i + 2}`).join(",")})`,
    [userId, ...ids],
  );
  const likeSet = new Set(likes.map((r) => r.target_id));
  const buySet = new Set(bought.map((r) => r.item_id));
  return tracks.map((t) => ({
    ...t,
    liked: likeSet.has(t.id),
    purchased: buySet.has(t.id),
  }));
}

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return await loadHome();
  } catch (err) {
    console.error("[verzzify] getHomeData", err);
    throw err;
  }
});

export async function loadHome() {
  const sql = await getSql();
  const userId = await optionalUserId();
  if (userId) {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const u = await getSessionUser();
    await ensureProfile(userId, u?.email ?? null, u?.email ?? null, null);
  }

  const fetchTracks = async (where: string, params: unknown[], limit = 10) => {
    const rows = await sql.query<TrackRow>(
      `select ${TRACK_COLS} ${TRACK_FROM} where t.status = 'published' ${where} limit ${limit}`,
      params,
    );
    return decorate(rows.map((r) => mapTrack(r)), userId);
  };

  const [trending, charts, hiphop, afrobeats, gospel, amapiano, latin, pop, electronic, free, newest] = await Promise.all([
    fetchTracks("order by t.play_count desc", [], 12),
    fetchTracks("order by (t.play_count + coalesce((select units from chart_download_units u where u.track_id = t.id), 0) * 200) desc, t.play_count desc", [], 10),
    fetchTracks("and t.genre = $1 order by t.play_count desc", ["Hip Hop"], 8),
    fetchTracks("and t.genre = $1 order by t.play_count desc", ["Afrobeats"], 8),
    fetchTracks("and t.genre = $1 order by t.play_count desc", ["Gospel"], 6),
    fetchTracks("and t.genre = $1 order by t.play_count desc", ["Amapiano"], 6),
    fetchTracks("and t.genre = $1 order by t.play_count desc", ["Latin"], 8),
    fetchTracks("and t.genre in ('City Pop','Electropop','Indie Pop','Pop') order by t.play_count desc", [], 8),
    fetchTracks("and t.genre in ('Electronic','Techno','Electropop') order by t.play_count desc", [], 8),
    fetchTracks("and t.distribution in ('free_download','free_stream') order by t.play_count desc", [], 8),
    fetchTracks("order by t.created_at desc", [], 10),
  ]);

  let fromFollowed: TrackCard[] = [];
  let followingIds: string[] = [];
  if (userId) {
    const ids = await sql<{ following_id: string }>`
      select following_id from follows where follower_id = ${userId}
    `;
    followingIds = ids.map((r) => r.following_id);
    if (followingIds.length) {
      fromFollowed = await fetchTracks(
        "and a.user_id in (select following_id from follows where follower_id = $1) order by t.created_at desc",
        [userId],
        12,
      );
    }
  }

  const artists = await sql.query<Record<string, unknown>>(
    `select p.id, p.username as slug, a.artist_name as name, p.avatar_url, p.banner_url,
            p.country, p.city, a.biography as bio, a.genres, a.verification_status,
            a.monthly_listeners, p.role,
            (select count(*) from follows f where f.following_id = p.id) as followers
     from artist_profiles a
     join profiles p on p.id = a.user_id
     order by a.monthly_listeners desc
     limit 10`,
  );

  const albums = await sql.query<Record<string, unknown>>(
    `select al.id, al.title, al.cover_url, al.album_type, al.artist_id, al.price_cents,
            al.currency, al.release_date, a.artist_name, p.username as artist_slug
     from albums al
     join artist_profiles a on a.user_id = al.artist_id
     join profiles p on p.id = a.user_id
     order by al.release_date desc
     limit 8`,
  );

  const playlists = await sql<PlaylistCard>`
    select id, title, description, cover_url as "coverUrl", kind from playlists
    where is_system = true and is_public = true
  `;

  const events = await sql.query<Record<string, unknown>>(
    `select e.id, e.title, e.poster_url, e.venue, e.city, e.country, e.starts_at, e.description,
            pr.display_name as organizer_name
     from events e join profiles pr on pr.id = e.organizer_id
     where e.status = 'published' order by e.starts_at asc limit 6`,
  );

  const live = await sql.query<Record<string, unknown>>(
    `select l.id, l.title, l.poster_url, l.starts_at, l.price_cents, l.is_free, l.status,
            a.artist_name, p.username as artist_slug
     from live_events l
     join artist_profiles a on a.user_id = l.artist_id
     join profiles p on p.id = a.user_id
     order by l.starts_at asc limit 4`,
  );

  const posts = await loadPosts(sql, 8);
  const promoted = await loadActivePromotions(8);

  let country = "US";
  let city: string | null = null;
  try {
    const geo = await detectViewerGeo();
    country = geo.region;
    city = geo.city;
  } catch {
    /* keep US */
  }
  if (userId) {
    const row = await sql<{ country: string | null }>`
      select country from profiles where id = ${userId} limit 1
    `;
    if (row[0]?.country) country = normalizeRegion(row[0].country);
  }
  const youtubeHome = await loadYoutubeHome(country, city);

  return {
    trending,
    charts,
    hiphop,
    afrobeats,
    gospel,
    amapiano,
    latin,
    pop,
    electronic,
    free,
    newest,
    artists: artists.map(mapArtist),
    albums: albums.map(mapAlbum),
    playlists,
    events: events.map(mapEvent),
    live: live.map(mapLive),
    posts,
    promoted,
    country: youtubeHome.region,
    youtubeHome,
    fromFollowed,
    followingIds,
  };
}

function mapArtist(r: Record<string, unknown>): ArtistCard {
  return {
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
}

function mapAlbum(r: Record<string, unknown>): AlbumCard {
  return {
    id: String(r.id),
    title: String(r.title),
    coverUrl: String(r.cover_url),
    albumType: String(r.album_type),
    artistId: String(r.artist_id),
    artistName: String(r.artist_name),
    artistSlug: String(r.artist_slug),
    priceCents: Number(r.price_cents) || 0,
    currency: String(r.currency),
    releaseDate: r.release_date ? String(r.release_date) : null,
  };
}

function mapEvent(r: Record<string, unknown>): EventCard {
  return {
    id: String(r.id),
    title: String(r.title),
    posterUrl: String(r.poster_url),
    venue: (r.venue as string) ?? null,
    city: (r.city as string) ?? null,
    country: (r.country as string) ?? null,
    startsAt: iso(r.starts_at),
    description: (r.description as string) ?? null,
    organizerName: String(r.organizer_name ?? ""),
  };
}

function mapLive(r: Record<string, unknown>): LiveCard {
  return {
    id: String(r.id),
    title: String(r.title),
    posterUrl: String(r.poster_url),
    startsAt: iso(r.starts_at),
    priceCents: Number(r.price_cents) || 0,
    isFree: Boolean(r.is_free),
    artistName: String(r.artist_name),
    artistSlug: String(r.artist_slug),
    status: String(r.status),
  };
}

async function loadChartRanks(
  sql: Awaited<ReturnType<typeof getSql>>,
  ids: string[],
): Promise<Record<string, number>> {
  if (!ids.length) return {};
  const rows = await sql.query<{ item_id: string; position: number }>(
    `select item_id, position from chart_ranks
     where snapshot_id = 'snap_tracks_global' and item_type = 'track'
       and item_id in (${ids.map((_, i) => `$${i + 1}`).join(",")})`,
    ids,
  );
  return Object.fromEntries(rows.map((r) => [r.item_id, Number(r.position)]));
}

async function loadArtistLive(
  sql: Awaited<ReturnType<typeof getSql>>,
  artistId: string,
): Promise<LiveCard[]> {
  const rows = await sql.query<Record<string, unknown>>(
    `select l.id, l.title, l.poster_url, l.starts_at, l.price_cents, l.is_free, l.status,
            a.artist_name, p.username as artist_slug
     from live_events l
     join artist_profiles a on a.user_id = l.artist_id
     join profiles p on p.id = a.user_id
     where l.artist_id = $1
     order by l.starts_at desc limit 6`,
    [artistId],
  );
  return rows.map(mapLive);
}

async function loadPosts(
  sql: Awaited<ReturnType<typeof getSql>>,
  limit = 20,
): Promise<PostCard[]> {
  const rows = await sql.query<Record<string, unknown>>(
    `select po.id, po.body, po.image_url, po.like_count, po.created_at, po.track_id,
            pr.display_name as author_name, pr.username as author_slug, pr.avatar_url as author_avatar
     from posts po join profiles pr on pr.id = po.user_id
     order by po.created_at desc limit $1`,
    [limit],
  );
  const trackIds = rows.map((r) => r.track_id).filter(Boolean) as string[];
  let trackMap: Record<string, TrackCard> = {};
  if (trackIds.length) {
    const ts = await sql.query<TrackRow>(
      `select ${TRACK_COLS} ${TRACK_FROM} where t.id in (${trackIds.map((_, i) => `$${i + 1}`).join(",")})`,
      trackIds,
    );
    trackMap = Object.fromEntries(ts.map((t) => [t.id, mapTrack(t)]));
  }
  return rows.map((r) => ({
    id: String(r.id),
    body: String(r.body),
    imageUrl: (r.image_url as string) ?? null,
    likeCount: Number(r.like_count) || 0,
    createdAt: iso(r.created_at),
    authorName: String(r.author_name),
    authorSlug: String(r.author_slug),
    authorAvatar: (r.author_avatar as string) ?? null,
    track: r.track_id ? trackMap[String(r.track_id)] ?? null : null,
  }));
}

export const searchCatalog = createServerFn({ method: "GET" })
  .validator((q: string) => q.trim().slice(0, 80))
  .handler(async ({ data: q }) => {
    const sql = await getSql();
    const userId = await optionalUserId();
    if (userId) {
      const id = `sl_${Date.now()}`;
      await sql`insert into search_log (id, user_id, query) values (${id}, ${userId}, ${q})`;
    }
    if (!q) return { tracks: [], artists: [], albums: [], events: [] as EventCard[], youtube: { videos: [], promoted: [] as YouTubePromotion[] } };
    const like = `%${q}%`;
    const tracks = await sql.query<TrackRow>(
      `select ${TRACK_COLS} ${TRACK_FROM}
       where t.status = 'published' and (t.title ilike $1 or a.artist_name ilike $1 or t.genre ilike $1)
       order by t.play_count desc limit 20`,
      [like],
    );
    const artists = await sql.query<Record<string, unknown>>(
      `select p.id, p.username as slug, a.artist_name as name, p.avatar_url, p.banner_url,
              p.country, p.city, a.biography as bio, a.genres, a.verification_status,
              a.monthly_listeners, p.role, 0 as followers
       from artist_profiles a join profiles p on p.id = a.user_id
       where a.artist_name ilike $1 or a.genres ilike $1 or p.city ilike $1
       limit 12`,
      [like],
    );
    const albums = await sql.query<Record<string, unknown>>(
      `select al.id, al.title, al.cover_url, al.album_type, al.artist_id, al.price_cents,
              al.currency, al.release_date, a.artist_name, p.username as artist_slug
       from albums al
       join artist_profiles a on a.user_id = al.artist_id
       join profiles p on p.id = a.user_id
       where al.title ilike $1 limit 8`,
      [like],
    );
    const events = await sql.query<Record<string, unknown>>(
      `select e.id, e.title, e.poster_url, e.venue, e.city, e.country, e.starts_at, e.description,
              pr.display_name as organizer_name
       from events e join profiles pr on pr.id = e.organizer_id
       where e.title ilike $1 or e.city ilike $1 limit 6`,
      [like],
    );
    const youtube = await searchYoutubeCatalog(q);
    return {
      tracks: await decorate(tracks.map((r) => mapTrack(r)), userId),
      artists: artists.map(mapArtist),
      albums: albums.map(mapAlbum),
      events: events.map(mapEvent),
      youtube,
    };
  });

export const getTrackPage = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const sql = await getSql();
    const userId = await optionalUserId();
    const rows = await sql.query<TrackRow>(
      `select ${TRACK_COLS} ${TRACK_FROM} where t.id = $1 limit 1`,
      [id],
    );
    if (!rows[0]) return null;
    const [track] = await decorate([mapTrack(rows[0])], userId);
    const comments = await sql.query<{ id: string; body: string; created_at: unknown; name: string }>(
      `select c.id, c.body, c.created_at, p.display_name as name
       from comments c join profiles p on p.id = c.user_id
       where c.target_type = 'track' and c.target_id = $1
       order by c.created_at desc limit 30`,
      [id],
    );
    const related = await sql.query<TrackRow>(
      `select ${TRACK_COLS} ${TRACK_FROM}
       where t.status = 'published' and t.id <> $1 and (t.genre = $2 or t.artist_id = $3)
       order by t.play_count desc limit 6`,
      [id, track.genre, track.artistId],
    );
    return {
      track,
      comments: comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: iso(c.created_at),
        name: c.name,
      })),
      related: await decorate(related.map((r) => mapTrack(r)), userId),
    };
  });

export const getArtistPage = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const sql = await getSql();
    const userId = await optionalUserId();
    const arts = await sql.query<Record<string, unknown>>(
      `select p.id, p.username as slug, a.artist_name as name, p.avatar_url, p.banner_url,
              p.country, p.city, a.biography as bio, a.genres, a.verification_status,
              a.monthly_listeners, p.role,
              (select count(*) from follows f where f.following_id = p.id) as followers
       from artist_profiles a join profiles p on p.id = a.user_id
       where p.username = $1 limit 1`,
      [slug],
    );
    if (!arts[0]) return null;
    const artist = mapArtist(arts[0]);
    const tracks = await sql.query<TrackRow>(
      `select ${TRACK_COLS} ${TRACK_FROM} where t.artist_id = $1 and t.status = 'published'
       order by t.play_count desc`,
      [artist.id],
    );
    const albums = await sql.query<Record<string, unknown>>(
      `select al.id, al.title, al.cover_url, al.album_type, al.artist_id, al.price_cents,
              al.currency, al.release_date, a.artist_name, p.username as artist_slug
       from albums al
       join artist_profiles a on a.user_id = al.artist_id
       join profiles p on p.id = a.user_id
       where al.artist_id = $1`,
      [artist.id],
    );
    let following = false;
    if (userId) {
      const f = await sql<{ follower_id: string }>`
        select follower_id from follows where follower_id = ${userId} and following_id = ${artist.id}
      `;
      following = Boolean(f[0]);
    }
    const call = await sql<{ price_cents: number; duration_min: number; available: boolean }>`
      select price_cents, duration_min, available from video_call_services where artist_id = ${artist.id}
    `;
    const youtube = await loadArtistYoutube(artist.id);
    const decoratedTracks = await decorate(tracks.map((r) => mapTrack(r)), userId);
    return {
      artist,
      tracks: decoratedTracks,
      albums: albums.map(mapAlbum),
      following,
      videoCall: call[0]
        ? {
            priceCents: Number(call[0].price_cents),
            durationMin: Number(call[0].duration_min),
            available: Boolean(call[0].available),
          }
        : null,
      youtube,
      live: await loadArtistLive(sql, artist.id),
      chartRanks: await loadChartRanks(
        sql,
        decoratedTracks.map((t) => t.id),
      ),
    };
  });

export const getAlbumPage = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const sql = await getSql();
    const userId = await optionalUserId();
    const albums = await sql.query<Record<string, unknown>>(
      `select al.id, al.title, al.cover_url, al.album_type, al.artist_id, al.price_cents,
              al.currency, al.release_date, a.artist_name, p.username as artist_slug
       from albums al
       join artist_profiles a on a.user_id = al.artist_id
       join profiles p on p.id = a.user_id
       where al.id = $1 limit 1`,
      [id],
    );
    if (!albums[0]) return null;
    const tracks = await sql.query<TrackRow>(
      `select ${TRACK_COLS} ${TRACK_FROM} where t.album_id = $1 order by t.sort_order`,
      [id],
    );
    return {
      album: mapAlbum(albums[0]),
      tracks: await decorate(tracks.map((r) => mapTrack(r)), userId),
    };
  });

export const getPlaylistPage = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const sql = await getSql();
    const userId = await optionalUserId();
    const pl = await sql<{ id: string; title: string; description: string | null; cover_url: string | null; kind: string }>`
      select id, title, description, cover_url, kind from playlists where id = ${id} limit 1
    `;
    if (!pl[0]) return null;
    const tracks = await sql.query<TrackRow>(
      `select ${TRACK_COLS} ${TRACK_FROM}
       join playlist_tracks pt on pt.track_id = t.id
       where pt.playlist_id = $1
       order by pt.position`,
      [id],
    );
    return {
      playlist: {
        id: pl[0].id,
        title: pl[0].title,
        description: pl[0].description,
        coverUrl: pl[0].cover_url,
        kind: pl[0].kind,
      } satisfies PlaylistCard,
      tracks: await decorate(tracks.map((r) => mapTrack(r)), userId),
    };
  });

export const getEventPage = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      `select e.id, e.title, e.poster_url, e.venue, e.city, e.country, e.starts_at, e.description,
              pr.display_name as organizer_name
       from events e join profiles pr on pr.id = e.organizer_id
       where e.id = $1 limit 1`,
      [id],
    );
    if (!rows[0]) return null;
    const types = await sql<TicketType>`
      select id, name, price_cents as "priceCents", currency, capacity, sold
      from event_ticket_types where event_id = ${id}
    `;
    return { event: mapEvent(rows[0]), types };
  });

export const getLivePage = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const sql = await getSql();
    const userId = await optionalUserId();
    const rows = await sql.query<Record<string, unknown>>(
      `select l.id, l.title, l.poster_url, l.starts_at, l.price_cents, l.is_free, l.status,
              a.artist_name, p.username as artist_slug, l.description
       from live_events l
       join artist_profiles a on a.user_id = l.artist_id
       join profiles p on p.id = a.user_id
       where l.id = $1 limit 1`,
      [id],
    );
    if (!rows[0]) return null;
    let entitled = Boolean(rows[0].is_free);
    if (userId && !entitled) {
      const e = await sql<{ user_id: string }>`
        select user_id from live_entitlements where user_id = ${userId} and live_event_id = ${id}
      `;
      entitled = Boolean(e[0]);
    }
    return {
      live: { ...mapLive(rows[0]), description: String(rows[0].description ?? "") },
      entitled,
    };
  });

export const getCommunity = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return loadPosts(sql, 24);
});

export const getDiscover = createServerFn({ method: "GET" }).handler(async () => {
  const home = await loadHome();
  const nearby = await loadNearby();
  return { ...home, nearby };
});

export const recordStream = createServerFn({ method: "POST" })
  .validator((d: { trackId: string; listenedMs: number }) => d)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const userId = await optionalUserId();
    const meaningful = data.listenedMs >= 30000;
    const id = `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await sql`
      insert into stream_events (id, user_id, track_id, listened_ms, meaningful)
      values (${id}, ${userId}, ${data.trackId}, ${data.listenedMs}, ${meaningful})
    `;
    if (meaningful) {
      await sql`update tracks set play_count = play_count + 1 where id = ${data.trackId}`;
    }
    if (userId) {
      const hid = `hi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await sql`
        insert into listening_history (id, user_id, track_id, duration_ms, completed)
        values (${hid}, ${userId}, ${data.trackId}, ${data.listenedMs}, ${data.listenedMs >= 60000})
      `;
    }
    return { meaningful };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((trackId: string) => trackId)
  .handler(async ({ context, data: trackId }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, null, null, null);
    const existing = await sql<{ target_id: string }>`
      select target_id from favorites
      where user_id = ${context.userId} and target_type = 'track' and target_id = ${trackId}
    `;
    if (existing[0]) {
      await sql`delete from favorites where user_id = ${context.userId} and target_type = 'track' and target_id = ${trackId}`;
      await sql`update tracks set like_count = greatest(like_count - 1, 0) where id = ${trackId}`;
      await sql`delete from playlist_tracks where playlist_id = ${`pl_liked_${context.userId}`} and track_id = ${trackId}`;
      return { liked: false };
    }
    await sql`
      insert into favorites (user_id, target_type, target_id)
      values (${context.userId}, 'track', ${trackId})
    `;
    await sql`update tracks set like_count = like_count + 1 where id = ${trackId}`;
    await sql`
      insert into playlist_tracks (playlist_id, track_id, position)
      values (${`pl_liked_${context.userId}`}, ${trackId}, 0)
      on conflict do nothing
    `;
    return { liked: true };
  });

export const toggleFollow = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((artistId: string) => artistId)
  .handler(async ({ context, data: artistId }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, null, null, null);
    const existing = await sql<{ follower_id: string }>`
      select follower_id from follows where follower_id = ${context.userId} and following_id = ${artistId}
    `;
    if (existing[0]) {
      await sql`delete from follows where follower_id = ${context.userId} and following_id = ${artistId}`;
      return { following: false };
    }
    if (artistId === context.userId) {
      return { following: false };
    }
    await sql`insert into follows (follower_id, following_id) values (${context.userId}, ${artistId})`;
    return { following: true };
  });

export const purchaseTrack = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { trackId: string; license: "basic" | "premium" }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, null, null, null);
    const rows = await sql.query<TrackRow>(
      `select ${TRACK_COLS} ${TRACK_FROM} where t.id = $1 limit 1`,
      [data.trackId],
    );
    const t = rows[0];
    if (!t) throw new Error("TRACK_NOT_FOUND");
    const already = await sql<{ item_id: string }>`
      select pi.item_id from purchase_items pi
      join purchases p on p.id = pi.purchase_id
      where p.buyer_id = ${context.userId} and p.status = 'completed'
        and pi.item_type = 'track' and pi.item_id = ${data.trackId}
    `;
    if (already[0]) return { ok: true, already: true as const };

    const rule = await sql<{ platform_bps: number; processor_bps: number }>`
      select platform_bps, processor_bps from commission_rules where product_type = 'track' limit 1
    `;
    const platformBps = Number(rule[0]?.platform_bps ?? 1500);
    const processorBps = Number(rule[0]?.processor_bps ?? 300);
    const gross = Number(t.price_cents) || 0;
    if (gross <= 0 && t.distribution !== "premium") {
      return { ok: true, already: false as const, free: true as const };
    }
    const processorFee = Math.round((gross * processorBps) / 10000);
    const platformFee = Math.round((gross * platformBps) / 10000);
    const creator = Math.max(gross - processorFee - platformFee, 0);
    const pid = `pur_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const snapshot = JSON.stringify({
      platformBps,
      processorBps,
      product: "track",
      license: data.license,
    });
    await sql`
      insert into purchases (id, buyer_id, status, currency, gross_cents, processor_fee_cents, platform_fee_cents, creator_cents, fee_snapshot)
      values (${pid}, ${context.userId}, 'completed', ${t.currency}, ${gross}, ${processorFee}, ${platformFee}, ${creator}, ${snapshot})
    `;
    await sql`
      insert into purchase_items (id, purchase_id, item_type, item_id, title, price_cents)
      values (${`${pid}_i`}, ${pid}, 'track', ${t.id}, ${t.title}, ${gross})
    `;
    const licenseType =
      data.license === "premium" && t.distribution === "premium" ? "premium" : "basic";
    const rights =
      licenseType === "premium"
        ? "Authorized downloadable file for personal use. Copyright remains with the artist. This is not a transfer of ownership."
        : "Access inside your VerzZify account. Copyright remains with the artist. This is not a transfer of ownership.";
    await sql`
      insert into licenses (id, purchase_id, user_id, track_id, license_type, rights_text)
      values (${`${pid}_lic`}, ${pid}, ${context.userId}, ${t.id}, ${licenseType}, ${rights})
    `;
    await sql`
      insert into playlist_tracks (playlist_id, track_id, position)
      values (${`pl_purchased_${context.userId}`}, ${t.id}, 0)
      on conflict do nothing
    `;
    await sql`
      insert into wallets (user_id, currency) values (${t.artist_id}, ${t.currency})
      on conflict do nothing
    `;
    await sql`
      insert into ledger_entries (id, wallet_user_id, amount_cents, direction, kind, ref_type, ref_id, available, meta)
      values (${`${pid}_led`}, ${t.artist_id}, ${creator}, 'credit', 'sale', 'track', ${pid}, true, ${snapshot})
    `;
    await sql`
      insert into payment_transactions (id, user_id, provider, amount_cents, currency, status, purpose)
      values (${`${pid}_pay`}, ${context.userId}, 'verzzify_wallet_sim', ${gross}, ${t.currency}, 'completed', 'track_purchase')
    `;
    return { ok: true, already: false as const, purchaseId: pid, rights, licenseType };
  });

export const buyTicket = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((typeId: string) => typeId)
  .handler(async ({ context, data: typeId }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, null, null, null);
    const tt = await sql<{
      id: string;
      event_id: string;
      name: string;
      price_cents: number;
      currency: string;
      capacity: number;
      sold: number;
    }>`select * from event_ticket_types where id = ${typeId} limit 1`;
    const row = tt[0];
    if (!row) throw new Error("TICKET_TYPE_NOT_FOUND");
    if (row.sold >= row.capacity) throw new Error("SOLD_OUT");
    const rule = await sql<{ platform_bps: number; processor_bps: number }>`
      select platform_bps, processor_bps from commission_rules where product_type = 'ticket' limit 1
    `;
    const gross = Number(row.price_cents);
    const processorFee = Math.round((gross * Number(rule[0]?.processor_bps ?? 300)) / 10000);
    const platformFee = Math.round((gross * Number(rule[0]?.platform_bps ?? 1000)) / 10000);
    const creator = Math.max(gross - processorFee - platformFee, 0);
    const pid = `pur_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const code = `SHB-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const snapshot = JSON.stringify({ platformBps: rule[0]?.platform_bps, product: "ticket" });
    await sql`
      insert into purchases (id, buyer_id, status, currency, gross_cents, processor_fee_cents, platform_fee_cents, creator_cents, fee_snapshot)
      values (${pid}, ${context.userId}, 'completed', ${row.currency}, ${gross}, ${processorFee}, ${platformFee}, ${creator}, ${snapshot})
    `;
    await sql`update event_ticket_types set sold = sold + 1 where id = ${typeId}`;
    await sql`
      insert into tickets (id, ticket_type_id, event_id, buyer_id, code, qr_payload, status)
      values (${`tix_${code}`}, ${typeId}, ${row.event_id}, ${context.userId}, ${code}, ${code}, 'valid')
    `;
    const ev = await sql<{ organizer_id: string }>`select organizer_id from events where id = ${row.event_id}`;
    if (ev[0]) {
      await sql`insert into wallets (user_id, currency) values (${ev[0].organizer_id}, ${row.currency}) on conflict do nothing`;
      await sql`
        insert into ledger_entries (id, wallet_user_id, amount_cents, direction, kind, ref_type, ref_id, available)
        values (${`${pid}_led`}, ${ev[0].organizer_id}, ${creator}, 'credit', 'sale', 'ticket', ${pid}, true)
      `;
    }
    return { ok: true, code, ticketId: `tix_${code}` };
  });

export const buyLiveAccess = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((liveId: string) => liveId)
  .handler(async ({ context, data: liveId }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, null, null, null);
    const live = await sql<{ id: string; price_cents: number; is_free: boolean; artist_id: string; currency?: string }>`
      select id, price_cents, is_free, artist_id from live_events where id = ${liveId} limit 1
    `;
    const row = live[0];
    if (!row) throw new Error("LIVE_NOT_FOUND");
    if (row.is_free || Number(row.price_cents) === 0) {
      await sql`
        insert into live_entitlements (user_id, live_event_id) values (${context.userId}, ${liveId})
        on conflict do nothing
      `;
      return { ok: true, token: `live_${liveId}_${context.userId}` };
    }
    const existing = await sql<{ user_id: string }>`
      select user_id from live_entitlements where user_id = ${context.userId} and live_event_id = ${liveId}
    `;
    if (existing[0]) return { ok: true, token: `live_${liveId}_${context.userId}` };
    const gross = Number(row.price_cents);
    const pid = `pur_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const platformFee = Math.round((gross * 1200) / 10000);
    const processorFee = Math.round((gross * 300) / 10000);
    const creator = Math.max(gross - platformFee - processorFee, 0);
    await sql`
      insert into purchases (id, buyer_id, status, currency, gross_cents, processor_fee_cents, platform_fee_cents, creator_cents, fee_snapshot)
      values (${pid}, ${context.userId}, 'completed', ${row.currency ?? "USD"}, ${gross}, ${processorFee}, ${platformFee}, ${creator}, '{"product":"live"}')
    `;
    await sql`
      insert into live_entitlements (user_id, live_event_id) values (${context.userId}, ${liveId})
    `;
    await sql`
      insert into ledger_entries (id, wallet_user_id, amount_cents, direction, kind, ref_type, ref_id, available)
      values (${`${pid}_led`}, ${row.artist_id}, ${creator}, 'credit', 'sale', 'live', ${pid}, true)
    `;
    return { ok: true, token: `live_${liveId}_${context.userId}` };
  });

export const getLibrary = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, null, null, null);
    const liked = await sql.query<TrackRow>(
      `select ${TRACK_COLS} ${TRACK_FROM}
       join favorites f on f.target_id = t.id
       where f.user_id = $1 and f.target_type = 'track'`,
      [context.userId],
    );
    const purchased = await sql.query<TrackRow>(
      `select distinct ${TRACK_COLS} ${TRACK_FROM}
       join purchase_items pi on pi.item_id = t.id
       join purchases pu on pu.id = pi.purchase_id
       where pu.buyer_id = $1 and pu.status = 'completed' and pi.item_type = 'track'`,
      [context.userId],
    );
    const history = await sql.query<TrackRow>(
      `select ${TRACK_COLS} ${TRACK_FROM}
       where t.id in (select h.track_id from listening_history h where h.user_id = $1)
       order by t.play_count desc
       limit 40`,
      [context.userId],
    );
    const following = await sql.query<Record<string, unknown>>(
      `select p.id, p.username as slug, a.artist_name as name, p.avatar_url, p.banner_url,
              p.country, p.city, a.biography as bio, a.genres, a.verification_status,
              a.monthly_listeners, p.role, 0 as followers
       from follows f
       join artist_profiles a on a.user_id = f.following_id
       join profiles p on p.id = a.user_id
       where f.follower_id = $1`,
      [context.userId],
    );
    const tickets = await sql.query<Record<string, unknown>>(
      `select ti.id, ti.code, ti.status, e.title, e.starts_at, e.poster_url, tt.name as type_name
       from tickets ti
       join events e on e.id = ti.event_id
       join event_ticket_types tt on tt.id = ti.ticket_type_id
       where ti.buyer_id = $1
       order by ti.created_at desc`,
      [context.userId],
    );
    return {
      liked: liked.map((r) => mapTrack(r, { liked: true })),
      purchased: purchased.map((r) => mapTrack(r, { purchased: true })),
      history: history.map((r) => mapTrack(r)),
      following: following.map(mapArtist),
      tickets: tickets.map((t) => ({
        id: String(t.id),
        code: String(t.code),
        status: String(t.status),
        title: String(t.title),
        startsAt: iso(t.starts_at),
        posterUrl: String(t.poster_url),
        typeName: String(t.type_name),
      })),
    };
  });

export const getWallet = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, null, null, null);
    const rows = await sql<{
      amount_cents: number;
      direction: string;
      available: boolean;
      kind: string;
    }>`select amount_cents, direction, available, kind from ledger_entries where wallet_user_id = ${context.userId}`;
    let available = 0;
    let pending = 0;
    let lifetime = 0;
    for (const r of rows) {
      const n = Number(r.amount_cents);
      const signed = r.direction === "debit" ? -n : n;
      if (r.direction === "credit") lifetime += n;
      if (r.available) available += signed;
      else pending += signed;
    }
    const ledger = await sql<LedgerRow>`
      select id, amount_cents as "amountCents", direction, kind, available,
             created_at as "createdAt", meta
      from ledger_entries where wallet_user_id = ${context.userId}
      order by created_at desc limit 40
    `;
    const snapshot: WalletSnapshot = {
      availableCents: available,
      pendingCents: pending,
      lifetimeCents: lifetime,
      currency: "USD",
    };
    return { snapshot, ledger: ledger.map((l) => ({ ...l, createdAt: iso(l.createdAt) })) };
  });

export const requestPayout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { amountCents: number; method: string; destination: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const min = await sql<{ value: string }>`select value from remote_config where key = 'min_payout_cents'`;
    const minCents = Number(min[0]?.value ?? 5000);
    if (data.amountCents < minCents) throw new Error("BELOW_MINIMUM");
    const id = `po_${Date.now()}`;
    await sql`
      insert into payout_requests (id, artist_id, amount_cents, currency, method, destination, status)
      values (${id}, ${context.userId}, ${data.amountCents}, 'USD', ${data.method}, ${data.destination}, 'requested')
    `;
    await sql`
      insert into ledger_entries (id, wallet_user_id, amount_cents, direction, kind, ref_type, ref_id, available)
      values (${`${id}_led`}, ${context.userId}, ${data.amountCents}, 'debit', 'payout', 'payout', ${id}, true)
    `;
    return { id, status: "requested" };
  });

export const becomeArtist = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { artistName: string; bio: string; country: string; genres: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, data.artistName, null, null);
    await sql`update profiles set role = 'artist', country = ${data.country}, bio = ${data.bio} where id = ${context.userId}`;
    await sql`
      insert into artist_profiles (user_id, artist_name, verification_status, biography, genres)
      values (${context.userId}, ${data.artistName}, 'pending', ${data.bio}, ${data.genres})
      on conflict (user_id) do update set artist_name = excluded.artist_name, biography = excluded.biography, genres = excluded.genres
    `;
    await sql`insert into wallets (user_id, currency) values (${context.userId}, 'USD') on conflict do nothing`;
    return { ok: true };
  });

export const publishTrack = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    title: string;
    genre: string;
    distribution: string;
    priceCents: number;
    coverUrl: string;
    audioUrl: string;
  }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const artist = await sql<{ user_id: string }>`select user_id from artist_profiles where user_id = ${context.userId}`;
    if (!artist[0]) throw new Error("NOT_AN_ARTIST");
    const id = `trk_${Date.now().toString(36)}`;
    await sql`
      insert into tracks (
        id, artist_id, title, cover_url, audio_url, duration_ms, genre, distribution,
        price_cents, currency, copyright_owner, status, country
      ) values (
        ${id}, ${context.userId}, ${data.title}, ${data.coverUrl}, ${data.audioUrl}, 75000,
        ${data.genre}, ${data.distribution}, ${data.priceCents}, 'USD', ${data.title}, 'published', 'US'
      )
    `;
    return { id };
  });

export const addComment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { targetType: string; targetId: string; body: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, null, null, null);
    const id = `c_${Date.now()}`;
    const body = data.body.trim().slice(0, 500);
    if (!body) throw new Error("EMPTY");
    await sql`
      insert into comments (id, user_id, target_type, target_id, body)
      values (${id}, ${context.userId}, ${data.targetType}, ${data.targetId}, ${body})
    `;
    return { id };
  });

export const createPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((body: string) => body.trim().slice(0, 500))
  .handler(async ({ context, data: body }) => {
    const sql = await getSql();
    await ensureProfile(context.userId, null, null, null);
    if (!body) throw new Error("EMPTY");
    const id = `post_${Date.now()}`;
    await sql`insert into posts (id, user_id, body) values (${id}, ${context.userId}, ${body})`;
    return { id };
  });

export const getStudioOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const artist = await sql<{ artist_name: string; verification_status: string; monthly_listeners: number }>`
      select artist_name, verification_status, monthly_listeners from artist_profiles where user_id = ${context.userId}
    `;
    const tracks = await sql.query<TrackRow>(
      `select ${TRACK_COLS} ${TRACK_FROM} where t.artist_id = $1 order by t.created_at desc`,
      [context.userId],
    );
    const streams = await sql<{ c: number }>`
      select count(*) as c from stream_events where track_id in (select id from tracks where artist_id = ${context.userId}) and meaningful = true
    `;
    return {
      artist: artist[0] ?? null,
      tracks: tracks.map((r) => mapTrack(r)),
      meaningfulStreams: Number(streams[0]?.c ?? 0),
    };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<MackProfileData | null> => {
    const sql = await getSql();
    await ensureProfile(context.userId, null, null, null);
    const p = await sql.query<Record<string, unknown>>(
      `select p.id, p.username, p.display_name, p.role, p.country, p.bio, p.avatar_url,
              p.banner_url, p.favorite_genres, p.city,
              a.verification_status, a.genres, a.monthly_listeners, a.biography, a.socials,
              a.artist_name,
              (select count(*) from follows f where f.following_id = p.id) as followers,
              (select count(*) from follows f where f.follower_id = p.id) as following_count,
              (select coalesce(sum(t.play_count), 0) from tracks t where t.artist_id = p.id) as total_plays
       from profiles p
       left join artist_profiles a on a.user_id = p.id
       where p.id = $1 limit 1`,
      [context.userId],
    );
    if (!p[0]) return null;
    const row = p[0];
    const tracks = await sql.query<TrackRow>(
      `select ${TRACK_COLS} ${TRACK_FROM} where t.artist_id = $1 and t.status = 'published'
       order by t.play_count desc`,
      [context.userId],
    );
    const albums = await sql.query<Record<string, unknown>>(
      `select al.id, al.title, al.cover_url, al.album_type, al.artist_id, al.price_cents,
              al.currency, al.release_date, a.artist_name, p.username as artist_slug
       from albums al
       join artist_profiles a on a.user_id = al.artist_id
       join profiles p on p.id = a.user_id
       where al.artist_id = $1`,
      [context.userId],
    );
    const liked = await sql.query<TrackRow>(
      `select ${TRACK_COLS} ${TRACK_FROM}
       join favorites f on f.target_id = t.id
       where f.user_id = $1 and f.target_type = 'track'`,
      [context.userId],
    );
    const playlists = await sql.query<PlaylistCard>(
      `select id, title, description, cover_url as "coverUrl", kind
       from playlists where user_id = $1 and is_system = false
       order by created_at desc`,
      [context.userId],
    );
    const following = await sql.query<Record<string, unknown>>(
      `select p.id, p.username as slug, a.artist_name as name, p.avatar_url, p.banner_url,
              p.country, p.city, a.biography as bio, a.genres, a.verification_status,
              a.monthly_listeners, p.role,
              (select count(*) from follows f2 where f2.following_id = p.id) as followers
       from follows f
       join artist_profiles a on a.user_id = f.following_id
       join profiles p on p.id = a.user_id
       where f.follower_id = $1`,
      [context.userId],
    );
    const suggested = await sql.query<Record<string, unknown>>(
      `select p.id, p.username as slug, a.artist_name as name, p.avatar_url, p.banner_url,
              p.country, p.city, a.biography as bio, a.genres, a.verification_status,
              a.monthly_listeners, p.role,
              (select count(*) from follows f2 where f2.following_id = p.id) as followers
       from artist_profiles a
       join profiles p on p.id = a.user_id
       where p.id <> $1
         and p.id not in (select following_id from follows where follower_id = $1)
       order by a.monthly_listeners desc
       limit 8`,
      [context.userId],
    );
    const posts = await sql.query<Record<string, unknown>>(
      `select po.id, po.body, po.image_url, po.like_count, po.created_at, po.track_id,
              pr.display_name as author_name, pr.username as author_slug, pr.avatar_url as author_avatar
       from posts po join profiles pr on pr.id = po.user_id
       where po.user_id = $1
       order by po.created_at desc limit 12`,
      [context.userId],
    );
    const decoratedTracks = await decorate(tracks.map((r) => mapTrack(r)), context.userId);
    const decoratedLiked = liked.map((r) => mapTrack(r, { liked: true }));
    const call = await sql<{ price_cents: number; duration_min: number; available: boolean }>`
      select price_cents, duration_min, available from video_call_services
      where artist_id = ${context.userId}
    `;
    return {
      id: String(row.id),
      username: String(row.username),
      displayName: String(row.artist_name || row.display_name),
      role: String(row.role),
      country: (row.country as string) ?? null,
      bio: (row.biography as string) || (row.bio as string) || null,
      avatarUrl: (row.avatar_url as string) ?? null,
      bannerUrl: (row.banner_url as string) ?? null,
      city: (row.city as string) ?? null,
      favoriteGenres: (row.favorite_genres as string) ?? null,
      verified: row.verification_status === "verified",
      genres: (row.genres as string) ?? null,
      monthlyListeners: Number(row.monthly_listeners) || 0,
      followers: Number(row.followers) || 0,
      followingCount: Number(row.following_count) || 0,
      totalPlays: Number(row.total_plays) || 0,
      socials: (row.socials as string) ?? null,
      tracks: decoratedTracks,
      albums: albums.map(mapAlbum),
      liked: decoratedLiked,
      playlists,
      following: following.map(mapArtist),
      suggested: suggested.map(mapArtist),
      posts: posts.map((r) => ({
        id: String(r.id),
        body: String(r.body),
        imageUrl: (r.image_url as string) ?? null,
        likeCount: Number(r.like_count) || 0,
        createdAt: iso(r.created_at),
        authorName: String(r.author_name),
        authorSlug: String(r.author_slug),
        authorAvatar: (r.author_avatar as string) ?? null,
        track: r.track_id ? decoratedTracks.find((t) => t.id === String(r.track_id)) ?? null : null,
      })),
      chartRanks: await loadChartRanks(
        sql,
        decoratedTracks.map((t) => t.id),
      ),
      live: await loadArtistLive(sql, context.userId),
      videoCall: call[0]
        ? {
            priceCents: Number(call[0].price_cents),
            durationMin: Number(call[0].duration_min),
            available: Boolean(call[0].available),
          }
        : null,
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { displayName: string; bio: string; country: string; city: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update profiles set display_name = ${data.displayName}, bio = ${data.bio},
        country = ${data.country}, city = ${data.city}, updated_at = now()
      where id = ${context.userId}
    `;
    return { ok: true };
  });

export const scanTicket = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((code: string) => code.trim())
  .handler(async ({ context, data: code }) => {
    const sql = await getSql();
    const t = await sql<{ id: string; status: string; event_id: string }>`
      select id, status, event_id from tickets where code = ${code} limit 1
    `;
    const row = t[0];
    if (!row) return { result: "invalid" as const };
    if (row.status === "used") {
      await sql`
        insert into ticket_scans (id, ticket_id, scanner_user_id, result)
        values (${`sc_${Date.now()}`}, ${row.id}, ${context.userId}, 'reuse')
      `;
      return { result: "already_used" as const };
    }
    await sql`update tickets set status = 'used' where id = ${row.id}`;
    await sql`
      insert into ticket_scans (id, ticket_id, scanner_user_id, result)
      values (${`sc_${Date.now()}`}, ${row.id}, ${context.userId}, 'ok')
    `;
    return { result: "ok" as const, eventId: row.event_id };
  });

export const getFlags = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<{ key: string; enabled: boolean }>`select key, enabled from feature_flags`;
  return Object.fromEntries(rows.map((r) => [r.key, r.enabled])) as Record<string, boolean>;
});

export const getNews = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<{
    id: string;
    title: string;
    slug: string;
    category: string;
    excerpt: string | null;
    cover_url: string | null;
  }>`select id, title, slug, category, excerpt, cover_url from articles where published = true order by created_at desc`;
});
