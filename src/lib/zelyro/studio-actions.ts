import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { newId } from "@/lib/utils";

async function requireArtist(userId: string) {
  const sql = await getSql();
  const row = await sql<{ user_id: string }>`
    select user_id from artist_profiles where user_id = ${userId} limit 1
  `;
  if (!row[0]) throw new Error("Become an artist first");
  return sql;
}

export const getCreatorStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const p = await sql<{ available: boolean; role: string }>`
      select available, role from profiles where id = ${context.userId} limit 1
    `;
    const a = await sql<{ artist_name: string }>`
      select artist_name from artist_profiles where user_id = ${context.userId} limit 1
    `;
    return {
      available: Boolean(p[0]?.available),
      isArtist: Boolean(a[0]),
      role: p[0]?.role ?? "fan",
    };
  });

export const setCreatorAvailable = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { available: boolean }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`update profiles set available = ${data.available} where id = ${context.userId}`;
    return { available: data.available };
  });

export const createAlbum = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { title: string; description: string; coverUrl: string; albumType: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await requireArtist(context.userId);
    const title = data.title.trim();
    if (!title) throw new Error("Title required");
    const id = newId("alb");
    await sql`
      insert into albums (id, artist_id, title, description, cover_url, release_date, album_type, price_cents, currency)
      values (${id}, ${context.userId}, ${title}, ${data.description.trim() || null},
              ${data.coverUrl || "/covers/desk-light.jpg"}, current_date,
              ${data.albumType || "album"}, 0, 'USD')
    `;
    return { id };
  });

export const createUserPlaylist = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { title: string; description: string; coverUrl: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const title = data.title.trim();
    if (!title) throw new Error("Title required");
    const id = newId("pl");
    await sql`
      insert into playlists (id, user_id, title, description, cover_url, is_public, is_system, kind)
      values (${id}, ${context.userId}, ${title}, ${data.description.trim() || null},
              ${data.coverUrl || "/covers/night-market.jpg"}, true, false, 'user')
    `;
    return { id };
  });

export const createTicketEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    title: string;
    hostName: string;
    startsAt: string;
    category: string;
    location: string;
    about: string;
    posterUrl: string;
    priceCents: number;
  }) => d)
  .handler(async ({ context, data }) => {
    const sql = await requireArtist(context.userId);
    const title = data.title.trim();
    if (!title) throw new Error("Event name required");
    if (!data.startsAt) throw new Error("Pick a date and time");
    const id = newId("evt");
    const loc = data.location.trim() || "TBA";
    await sql`
      insert into events (id, organizer_id, title, poster_url, venue, city, country, starts_at, description, status)
      values (
        ${id}, ${context.userId}, ${title}, ${data.posterUrl || "/events/rooftop.jpg"},
        ${loc}, ${loc}, 'US', ${data.startsAt},
        ${[data.category, data.hostName, data.about].filter(Boolean).join(" · ")},
        'published'
      )
    `;
    const tt = newId("tt");
    await sql`
      insert into event_ticket_types (id, event_id, name, price_cents, currency, capacity, sold)
      values (${tt}, ${id}, ${data.category || "General"}, ${Math.max(0, data.priceCents)}, 'USD', 200, 0)
    `;
    return { id };
  });

export const createLiveStream = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { title: string; description: string; startsAt: string; priceCents: number; posterUrl: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await requireArtist(context.userId);
    const title = data.title.trim();
    if (!title) throw new Error("Title required");
    const id = newId("live");
    const free = data.priceCents <= 0;
    await sql`
      insert into live_events (id, artist_id, title, poster_url, description, starts_at, price_cents, is_free, capacity, status)
      values (
        ${id}, ${context.userId}, ${title}, ${data.posterUrl || "/events/rooftop.jpg"},
        ${data.description.trim() || null}, ${data.startsAt || new Date().toISOString()},
        ${Math.max(0, data.priceCents)}, ${free}, 500, 'scheduled'
      )
    `;
    return { id };
  });

export const upsertVideoCall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { durationMin: number; priceCents: number }) => d)
  .handler(async ({ context, data }) => {
    const sql = await requireArtist(context.userId);
    await sql`
      insert into video_call_services (artist_id, duration_min, price_cents, currency, available)
      values (${context.userId}, ${data.durationMin || 15}, ${Math.max(0, data.priceCents)}, 'USD', true)
      on conflict (artist_id) do update set
        duration_min = excluded.duration_min,
        price_cents = excluded.price_cents,
        available = true
    `;
    const id = newId("vc");
    await sql`
      insert into video_chat_sessions (id, artist_id, duration_min, price_cents, currency, status, notes)
      values (${id}, ${context.userId}, ${data.durationMin || 15}, ${Math.max(0, data.priceCents)}, 'USD', 'waiting', 'Waiting room opened')
    `;
    return { id };
  });

export const listVideoChatHistory = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      duration_min: number;
      price_cents: number;
      status: string;
      notes: string | null;
      created_at: Date;
      artist_name: string | null;
      fan_name: string | null;
      artist_avatar: string | null;
    }>`
      select s.id, s.duration_min, s.price_cents, s.status, s.notes, s.created_at,
             a.artist_name, fp.display_name as fan_name, ap.avatar_url as artist_avatar
      from video_chat_sessions s
      join artist_profiles a on a.user_id = s.artist_id
      join profiles ap on ap.id = s.artist_id
      left join profiles fp on fp.id = s.fan_id
      where s.artist_id = ${context.userId} or s.fan_id = ${context.userId}
      order by s.created_at desc limit 30
    `;
    const svc = await sql<{ duration_min: number; price_cents: number; available: boolean }>`
      select duration_min, price_cents, available from video_call_services where artist_id = ${context.userId}
    `;
    return {
      service: svc[0]
        ? {
            durationMin: Number(svc[0].duration_min),
            priceCents: Number(svc[0].price_cents),
            available: svc[0].available,
          }
        : null,
      sessions: rows.map((r) => ({
        id: r.id,
        durationMin: Number(r.duration_min),
        priceCents: Number(r.price_cents),
        status: r.status,
        notes: r.notes,
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        artistName: r.artist_name,
        fanName: r.fan_name,
        artistAvatar: r.artist_avatar,
      })),
    };
  });
