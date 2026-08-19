import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { newId } from "@/lib/utils";
import type {
  CampaignAnalytics,
  CampaignContentType,
  CampaignStatus,
  ProducerCard,
  StudioPlace,
  YouTubePromotion,
  YouTubeVideo,
  YoutubeConnection,
} from "./types";
import {
  getPublicVideoStats,
  getVideoThumbnail,
  searchMusic,
  validateYouTubeUrl,
  youtubeWatchUrl,
} from "./youtube";

function iso(v: unknown): string {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

type PromoRow = Record<string, unknown>;

function mapPromotion(r: PromoRow): YouTubePromotion {
  const videoId = String(r.external_content_id ?? "");
  const video: YouTubeVideo = {
    videoId,
    title: String(r.video_title ?? "YouTube video"),
    thumbnailUrl: String(r.thumbnail_url ?? getVideoThumbnail(videoId)),
    channelName: String(r.channel_name ?? "YouTube"),
    channelId: (r.channel_id as string) ?? null,
    channelUrl: r.channel_id
      ? `https://www.youtube.com/channel/${String(r.channel_id)}`
      : null,
    publishedAt: r.published_at ? iso(r.published_at) : null,
    description: (r.link_description as string) ?? null,
    durationSeconds: r.duration_seconds != null ? Number(r.duration_seconds) : null,
    embeddable: r.embeddable !== false,
    url: String(r.external_url ?? youtubeWatchUrl(videoId)),
    viewCount: null,
    likeCount: null,
    source: "youtube",
  };
  return {
    campaignId: String(r.campaign_id),
    campaignName: String(r.campaign_name),
    description: (r.description as string) ?? null,
    status: String(r.status) as CampaignStatus,
    contentType: String(r.content_type) as CampaignContentType,
    genre: (r.target_genres as string) ?? null,
    country: (r.target_countries as string) ?? null,
    featured: Boolean(r.featured),
    budgetCents: Number(r.budget_cents) || 0,
    spentCents: Number(r.spent_cents) || 0,
    currency: String(r.currency ?? "GHS"),
    startDate: r.start_date ? String(r.start_date) : null,
    endDate: r.end_date ? String(r.end_date) : null,
    impressions: Number(r.impressions) || 0,
    clicks: Number(r.clicks) || 0,
    video,
    shebaArtistId: String(r.creator_id),
    shebaArtistName: String(r.artist_name ?? r.display_name ?? "Creator"),
    shebaArtistSlug: String(r.artist_slug ?? ""),
    shebaArtistAvatar: (r.artist_avatar as string) ?? null,
    linkId: String(r.link_id ?? r.external_music_link_id ?? ""),
  };
}

const PROMO_FROM = `
  from promotion_campaigns c
  left join external_music_links l on l.id = c.external_music_link_id
  join profiles p on p.id = c.creator_id
  left join artist_profiles a on a.user_id = c.creator_id
`;

const PROMO_COLS = `
  c.id as campaign_id, c.campaign_name, c.description, c.status, c.content_type,
  c.featured, c.budget_cents, c.spent_cents, c.currency, c.start_date, c.end_date,
  c.target_countries, c.target_genres, c.creator_id, c.external_music_link_id,
  l.id as link_id, l.title as video_title, l.thumbnail_url, l.channel_name, l.channel_id,
  l.external_url, l.external_content_id, l.description as link_description,
  l.duration_seconds, l.embeddable, l.published_at,
  coalesce(a.artist_name, p.display_name) as artist_name,
  p.username as artist_slug, p.avatar_url as artist_avatar, p.display_name,
  (select count(*) from promotion_impressions i where i.campaign_id = c.id) as impressions,
  (select count(*) from promotion_clicks k where k.campaign_id = c.id) as clicks
`;

async function optionalUserId(): Promise<string | null> {
  try {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const u = await getSessionUser();
    return u?.id ?? null;
  } catch {
    return null;
  }
}

async function isAdmin(userId: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ role: string }>`select role from profiles where id = ${userId} limit 1`;
  return rows[0]?.role === "admin" || rows[0]?.role === "super_admin";
}

export async function loadActivePromotions(limit = 8): Promise<YouTubePromotion[]> {
  const sql = await getSql();
  const rows = await sql.query<PromoRow>(
    `select ${PROMO_COLS} ${PROMO_FROM}
     where c.status = 'active' and c.content_type = 'youtube' and l.provider = 'youtube'
     order by c.featured desc, c.created_at desc
     limit $1`,
    [limit],
  );
  return rows.map(mapPromotion);
}

export const getActivePromotions = createServerFn({ method: "GET" }).handler(async () => {
  return loadActivePromotions(10);
});

export const validatePromotionLink = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((url: string) => url.trim().slice(0, 500))
  .handler(async ({ data: url }) => {
    return validateYouTubeUrl(url);
  });

export const createYoutubePromotion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    url: string;
    campaignName: string;
    description: string;
    country: string;
    genre: string;
    audience: string;
    budgetCents: number;
    dailyBudgetCents: number;
    startDate: string;
    endDate: string;
  }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const artist = await sql<{ user_id: string }>`
      select user_id from artist_profiles where user_id = ${context.userId}
    `;
    if (!artist[0]) throw new Error("Become an artist before running promotions.");
    const check = await validateYouTubeUrl(data.url);
    if (!check.ok || !check.video) throw new Error(check.reason ?? "Invalid YouTube link");
    const video = check.video;
    const linkId = newId("eml");
    await sql`
      insert into external_music_links (
        id, artist_id, provider, external_url, external_content_id, title, thumbnail_url,
        channel_name, channel_id, description, duration_seconds, category, is_featured, is_promoted, embeddable
      ) values (
        ${linkId}, ${context.userId}, 'youtube', ${video.url}, ${video.videoId}, ${video.title},
        ${video.thumbnailUrl}, ${video.channelName}, ${video.channelId}, ${video.description},
        ${video.durationSeconds}, 'music_video', true, true, ${video.embeddable}
      )
    `;
    const campId = newId("camp");
    const name = data.campaignName.trim() || video.title;
    await sql`
      insert into promotion_campaigns (
        id, creator_id, content_type, external_music_link_id, campaign_name, description, status,
        budget_cents, daily_budget_cents, spent_cents, currency, start_date, end_date,
        target_countries, target_genres, target_audience
      ) values (
        ${campId}, ${context.userId}, 'youtube', ${linkId}, ${name}, ${data.description.trim()},
        'pending_review', ${Math.max(0, data.budgetCents)}, ${Math.max(0, data.dailyBudgetCents)},
        0, 'GHS', ${data.startDate || null}, ${data.endDate || null},
        ${data.country}, ${data.genre}, ${data.audience}
      )
    `;
    const tid = newId("pt");
    await sql`
      insert into promotion_targets (id, campaign_id, target_type, target_value)
      values (${tid}, ${campId}, 'country', ${data.country})
    `;
    return { id: campId, status: "pending_review" as const, video };
  });

export const createCatalogPromotion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    contentType: Exclude<CampaignContentType, "youtube">;
    contentId: string;
    campaignName: string;
    description: string;
  }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const artist = await sql<{ user_id: string }>`
      select user_id from artist_profiles where user_id = ${context.userId}
    `;
    if (!artist[0]) throw new Error("Become an artist before running promotions.");
    const campId = newId("camp");
    await sql`
      insert into promotion_campaigns (
        id, creator_id, content_type, content_id, campaign_name, description, status, currency
      ) values (
        ${campId}, ${context.userId}, ${data.contentType}, ${data.contentId},
        ${data.campaignName.trim()}, ${data.description.trim()}, 'pending_review', 'GHS'
      )
    `;
    return { id: campId, status: "pending_review" as const };
  });

export const getMyCampaigns = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql.query<PromoRow>(
      `select ${PROMO_COLS} ${PROMO_FROM} where c.creator_id = $1 order by c.created_at desc`,
      [context.userId],
    );
    return rows.map(mapPromotion);
  });

function sinceFor(range: "today" | "7d" | "30d" | "lifetime"): string | null {
  if (range === "lifetime") return null;
  if (range === "today") return new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  if (range === "7d") return new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  return new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
}

export const getCampaignAnalytics = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { campaignId: string; range: "today" | "7d" | "30d" | "lifetime" }) => d)
  .handler(async ({ context, data }): Promise<CampaignAnalytics> => {
    const sql = await getSql();
    const camp = await sql<{
      creator_id: string;
      budget_cents: number;
      spent_cents: number;
      external_music_link_id: string | null;
    }>`
      select creator_id, budget_cents, spent_cents, external_music_link_id
      from promotion_campaigns where id = ${data.campaignId} limit 1
    `;
    if (!camp[0]) throw new Error("Campaign not found");
    if (camp[0].creator_id !== context.userId && !(await isAdmin(context.userId))) {
      throw new Error("FORBIDDEN");
    }
    const since = sinceFor(data.range);
    const scoped = async (table: string, extra = "") => {
      if (since) {
        return sql.query<{ c: number }>(
          `select count(*) as c from ${table} where campaign_id = $1 and created_at >= $2 ${extra}`,
          [data.campaignId, since],
        );
      }
      return sql.query<{ c: number }>(
        `select count(*) as c from ${table} where campaign_id = $1 ${extra}`,
        [data.campaignId],
      );
    };
    const unique = since
      ? await sql.query<{ c: number }>(
          `select count(distinct coalesce(user_id, id)) as c from promotion_impressions
           where campaign_id = $1 and created_at >= $2`,
          [data.campaignId, since],
        )
      : await sql.query<{ c: number }>(
          `select count(distinct coalesce(user_id, id)) as c from promotion_impressions where campaign_id = $1`,
          [data.campaignId],
        );
    const [imp, clicks, plays, profiles, shares, saves, follows] = await Promise.all([
      scoped("promotion_impressions"),
      scoped("promotion_clicks"),
      scoped("promotion_engagement", `and event_name = 'playback_open'`),
      scoped("promotion_engagement", `and event_name = 'profile_visit'`),
      scoped("promotion_engagement", `and event_name = 'share'`),
      scoped("promotion_engagement", `and event_name = 'save'`),
      scoped("promotion_engagement", `and event_name = 'follow'`),
    ]);
    const impressions = Number(imp[0]?.c ?? 0);
    const clickN = Number(clicks[0]?.c ?? 0);
    let youtubeViews: number | null = null;
    let youtubeViewsNote =
      "YouTube views are only shown when the official Data API returns them. Sheba never invents that number.";
    if (camp[0].external_music_link_id) {
      const link = await sql<{ external_content_id: string | null }>`
        select external_content_id from external_music_links where id = ${camp[0].external_music_link_id}
      `;
      const vid = link[0]?.external_content_id;
      if (vid) {
        const stats = await getPublicVideoStats(vid);
        if (stats.official) {
          youtubeViews = stats.viewCount;
          youtubeViewsNote = "Official YouTube view count from the Data API. Not the same as Sheba playback opens.";
        }
      }
    }
    const spent = Number(camp[0].spent_cents) || 0;
    const budget = Number(camp[0].budget_cents) || 0;
    return {
      impressions,
      uniqueImpressions: Number(unique[0]?.c ?? 0),
      clicks: clickN,
      playsInitiated: Number(plays[0]?.c ?? 0),
      profileVisits: Number(profiles[0]?.c ?? 0),
      shares: Number(shares[0]?.c ?? 0),
      saves: Number(saves[0]?.c ?? 0),
      followersGained: Number(follows[0]?.c ?? 0),
      ctr: impressions ? clickN / impressions : 0,
      spentCents: spent,
      remainingCents: Math.max(0, budget - spent),
      youtubeViews,
      youtubeViewsNote,
    };
  });

export const pauseCampaign = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((campaignId: string) => campaignId)
  .handler(async ({ context, data: campaignId }) => {
    const sql = await getSql();
    const row = await sql<{ creator_id: string; status: string }>`
      select creator_id, status from promotion_campaigns where id = ${campaignId} limit 1
    `;
    if (!row[0]) throw new Error("NOT_FOUND");
    if (row[0].creator_id !== context.userId && !(await isAdmin(context.userId))) {
      throw new Error("FORBIDDEN");
    }
    const next = row[0].status === "paused" ? "active" : "paused";
    await sql`update promotion_campaigns set status = ${next}, updated_at = now() where id = ${campaignId}`;
    return { status: next };
  });

export const recordImpression = createServerFn({ method: "POST" })
  .validator((campaignId: string) => campaignId)
  .handler(async ({ data: campaignId }) => {
    const sql = await getSql();
    const userId = await optionalUserId();
    await sql`
      insert into promotion_impressions (id, campaign_id, user_id)
      values (${newId("imp")}, ${campaignId}, ${userId})
    `;
    return { ok: true };
  });

export const recordClick = createServerFn({ method: "POST" })
  .validator((d: { campaignId: string; kind: string }) => d)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const userId = await optionalUserId();
    await sql`
      insert into promotion_clicks (id, campaign_id, user_id, kind)
      values (${newId("clk")}, ${data.campaignId}, ${userId}, ${data.kind})
    `;
    const event =
      data.kind === "play"
        ? "playback_open"
        : data.kind === "profile"
          ? "profile_visit"
          : data.kind === "share"
            ? "share"
            : data.kind === "save"
              ? "save"
              : null;
    if (event) {
      await sql`
        insert into promotion_engagement (id, campaign_id, user_id, event_name)
        values (${newId("eng")}, ${data.campaignId}, ${userId}, ${event})
      `;
    }
    return { ok: true };
  });

export const toggleSavePromotion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((linkId: string) => linkId)
  .handler(async ({ context, data: linkId }) => {
    const sql = await getSql();
    const existing = await sql<{ target_id: string }>`
      select target_id from favorites
      where user_id = ${context.userId} and target_type = 'youtube_link' and target_id = ${linkId}
    `;
    if (existing[0]) {
      await sql`
        delete from favorites
        where user_id = ${context.userId} and target_type = 'youtube_link' and target_id = ${linkId}
      `;
      return { saved: false };
    }
    await sql`
      insert into favorites (user_id, target_type, target_id)
      values (${context.userId}, 'youtube_link', ${linkId})
    `;
    return { saved: true };
  });

export const reportPromotion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { campaignId: string; reason: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into reports (id, reporter_id, target_type, target_id, reason)
      values (${newId("rep")}, ${context.userId}, 'promotion', ${data.campaignId}, ${data.reason})
    `;
    return { ok: true };
  });

export async function loadArtistYoutube(artistId: string) {
  const sql = await getSql();
  const conn = await sql<YoutubeConnection>`
    select channel_id as "channelId", channel_url as "channelUrl", channel_name as "channelName",
           avatar_url as "avatarUrl", subscriber_count as "subscriberCount"
    from youtube_connections where artist_id = ${artistId} limit 1
  `;
  const links = await sql.query<PromoRow>(
    `select id, title, thumbnail_url, channel_name, channel_id, external_url, external_content_id,
            description, duration_seconds, category, is_featured, is_promoted, embeddable
     from external_music_links
     where artist_id = $1 and provider = 'youtube'
     order by is_featured desc, is_promoted desc, created_at desc`,
    [artistId],
  );
  const videos = links.map((r) => ({
    id: String(r.id),
    category: String(r.category ?? "music_video"),
    featured: Boolean(r.is_featured),
    promoted: Boolean(r.is_promoted),
    video: {
      videoId: String(r.external_content_id ?? ""),
      title: String(r.title ?? "YouTube video"),
      thumbnailUrl: String(r.thumbnail_url ?? ""),
      channelName: String(r.channel_name ?? "YouTube"),
      channelId: (r.channel_id as string) ?? null,
      channelUrl: null,
      publishedAt: null,
      description: (r.description as string) ?? null,
      durationSeconds: r.duration_seconds != null ? Number(r.duration_seconds) : null,
      embeddable: r.embeddable !== false,
      url: String(r.external_url),
      viewCount: null,
      likeCount: null,
      source: "youtube" as const,
    } satisfies YouTubeVideo,
  }));
  return { connection: conn[0] ?? null, videos };
}

export const getArtistYoutube = createServerFn({ method: "GET" })
  .validator((artistId: string) => artistId)
  .handler(async ({ data: artistId }) => loadArtistYoutube(artistId));

export const connectYoutubeChannel = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { channelUrl: string; channelName: string; channelId: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const artist = await sql<{ user_id: string }>`
      select user_id from artist_profiles where user_id = ${context.userId}
    `;
    if (!artist[0]) throw new Error("NOT_AN_ARTIST");
    await sql`
      insert into youtube_connections (artist_id, channel_id, channel_url, channel_name)
      values (${context.userId}, ${data.channelId}, ${data.channelUrl}, ${data.channelName})
      on conflict (artist_id) do update set
        channel_id = excluded.channel_id,
        channel_url = excluded.channel_url,
        channel_name = excluded.channel_name,
        updated_at = now()
    `;
    return { ok: true };
  });

export async function searchYoutubeCatalog(q: string) {
  if (!q) return { videos: [] as YouTubeVideo[], promoted: [] as YouTubePromotion[] };
  const sql = await getSql();
  const like = `%${q}%`;
  const live = await searchMusic(q);
  const stored = await sql.query<PromoRow>(
    `select ${PROMO_COLS} ${PROMO_FROM}
     where c.status = 'active' and c.content_type = 'youtube'
       and (l.title ilike $1 or l.channel_name ilike $1 or c.campaign_name ilike $1 or c.target_genres ilike $1)
     limit 8`,
    [like],
  );
  const promoted = stored.map(mapPromotion);
  const seen = new Set(promoted.map((p) => p.video.videoId));
  const videos = live.filter((v) => !seen.has(v.videoId));
  return { videos, promoted };
}

export const searchYoutube = createServerFn({ method: "GET" })
  .validator((q: string) => q.trim().slice(0, 80))
  .handler(async ({ data: q }) => searchYoutubeCatalog(q));

export const getAdminCampaigns = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("FORBIDDEN");
    const sql = await getSql();
    const rows = await sql.query<PromoRow>(
      `select ${PROMO_COLS} ${PROMO_FROM} order by
         case c.status when 'pending_review' then 0 when 'active' then 1 else 2 end,
         c.created_at desc`,
    );
    const reports = await sql.query<{ id: string; target_id: string; reason: string; status: string }>(
      `select id, target_id, reason, status from reports where target_type = 'promotion' and status = 'open'`,
    );
    return { campaigns: rows.map(mapPromotion), reports };
  });

export const moderateCampaign = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { campaignId: string; action: "approve" | "reject" | "pause" | "feature" | "remove"; reason?: string }) => d)
  .handler(async ({ context, data }) => {
    if (!(await isAdmin(context.userId))) throw new Error("FORBIDDEN");
    const sql = await getSql();
    if (data.action === "approve") {
      await sql`update promotion_campaigns set status = 'active', updated_at = now() where id = ${data.campaignId}`;
    } else if (data.action === "reject") {
      await sql`
        update promotion_campaigns
        set status = 'rejected', rejection_reason = ${data.reason ?? "Rejected"}, updated_at = now()
        where id = ${data.campaignId}
      `;
    } else if (data.action === "pause") {
      await sql`update promotion_campaigns set status = 'paused', updated_at = now() where id = ${data.campaignId}`;
    } else if (data.action === "feature") {
      await sql`update promotion_campaigns set featured = true, status = 'active', updated_at = now() where id = ${data.campaignId}`;
    } else if (data.action === "remove") {
      await sql`update promotion_campaigns set status = 'rejected', rejection_reason = ${data.reason ?? "Removed"}, updated_at = now() where id = ${data.campaignId}`;
    }
    await sql`
      insert into admin_actions (id, admin_id, action, target_type, target_id, meta)
      values (${newId("aa")}, ${context.userId}, ${data.action}, 'promotion', ${data.campaignId}, ${data.reason ?? null})
    `;
    return { ok: true };
  });

export async function loadNearby() {
  const sql = await getSql();
  const artists = await sql.query<Record<string, unknown>>(
    `select p.id, p.username as slug, a.artist_name as name, p.avatar_url, p.city, p.country,
            a.verification_status, p.role
     from artist_profiles a join profiles p on p.id = a.user_id
     where p.role in ('artist', 'producer') and p.city is not null
     order by a.monthly_listeners desc limit 12`,
  );
  const producers = await sql.query<ProducerCard>(
    `select p.id, p.username as slug, coalesce(a.artist_name, p.display_name) as name,
            p.avatar_url as "avatarUrl", p.city, p.country,
            pr.display_title as title, pr.services, pr.available_for_collab as available
     from producer_profiles pr
     join profiles p on p.id = pr.user_id
     left join artist_profiles a on a.user_id = p.id`,
  );
  const events = await sql.query<Record<string, unknown>>(
    `select e.id, e.title, e.poster_url, e.venue, e.city, e.country, e.starts_at, e.description,
            pr.display_name as organizer_name
     from events e join profiles pr on pr.id = e.organizer_id
     where e.status = 'published' order by e.starts_at asc limit 6`,
  );
  const studios = await sql<StudioPlace>`
    select id, name, city, country, kind, description from studios
  `;
  return {
    artists: artists.map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      name: String(r.name),
      avatarUrl: (r.avatar_url as string) ?? null,
      city: (r.city as string) ?? null,
      country: (r.country as string) ?? null,
      verified: r.verification_status === "verified",
      role: String(r.role),
    })),
    producers,
    events: events.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      posterUrl: String(r.poster_url),
      venue: (r.venue as string) ?? null,
      city: (r.city as string) ?? null,
      country: (r.country as string) ?? null,
      startsAt: iso(r.starts_at),
      description: (r.description as string) ?? null,
      organizerName: String(r.organizer_name ?? ""),
    })),
    studios,
  };
}

export const getNearby = createServerFn({ method: "GET" }).handler(async () => loadNearby());

export const YouTubePromotionService = {
  createPromotion: createYoutubePromotion,
  validatePromotion: validatePromotionLink,
  activatePromotion: moderateCampaign,
  pausePromotion: pauseCampaign,
  recordImpression,
  recordClick,
  recordPlaybackOpen: (campaignId: string) => recordClick({ data: { campaignId, kind: "play" } }),
  getCampaignAnalytics,
};
