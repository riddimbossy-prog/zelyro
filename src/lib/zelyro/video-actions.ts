import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { newId } from "@/lib/utils";

export type VideoSession = {
  id: string;
  artistId: string;
  fanId: string | null;
  durationMin: number;
  priceCents: number;
  currency: string;
  status: string;
  notes: string | null;
  createdAt: string;
  artistName: string;
  artistSlug: string;
  artistAvatar: string | null;
  fanName: string | null;
};

function iso(v: unknown): string {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function mapSession(r: Record<string, unknown>): VideoSession {
  return {
    id: String(r.id),
    artistId: String(r.artist_id),
    fanId: r.fan_id ? String(r.fan_id) : null,
    durationMin: Number(r.duration_min) || 15,
    priceCents: Number(r.price_cents) || 0,
    currency: String(r.currency ?? "USD"),
    status: String(r.status),
    notes: r.notes ? String(r.notes) : null,
    createdAt: iso(r.created_at),
    artistName: String(r.artist_name ?? "Artist"),
    artistSlug: String(r.artist_slug ?? ""),
    artistAvatar: r.artist_avatar ? String(r.artist_avatar) : null,
    fanName: r.fan_name ? String(r.fan_name) : null,
  };
}

const SESSION_SQL = `
  select s.id, s.artist_id, s.fan_id, s.duration_min, s.price_cents, s.currency, s.status, s.notes, s.created_at,
         a.artist_name, ap.username as artist_slug, ap.avatar_url as artist_avatar,
         fp.display_name as fan_name
  from video_chat_sessions s
  join artist_profiles a on a.user_id = s.artist_id
  join profiles ap on ap.id = a.user_id
  left join profiles fp on fp.id = s.fan_id
`;

export const getVideoSession = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(`${SESSION_SQL} where s.id = $1 limit 1`, [id]);
    return rows[0] ? mapSession(rows[0]) : null;
  });

export const bookVideoCall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { artistId: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    if (data.artistId === context.userId) throw new Error("You cannot book yourself");
    const svc = await sql<{ duration_min: number; price_cents: number; currency: string; available: boolean }>`
      select duration_min, price_cents, currency, available from video_call_services where artist_id = ${data.artistId}
    `;
    const waiting = await sql<{ id: string }>`
      select id from video_chat_sessions
      where artist_id = ${data.artistId} and status = 'waiting' and fan_id is null
      order by created_at desc limit 1
    `;
    if (waiting[0]) {
      await sql`
        update video_chat_sessions
        set fan_id = ${context.userId}, status = 'live', notes = 'Fan joined'
        where id = ${waiting[0].id}
      `;
      return { id: waiting[0].id };
    }
    if (!svc[0]) throw new Error("This artist is not offering 1-1 video yet");
    const id = newId("vc");
    await sql`
      insert into video_chat_sessions (id, artist_id, fan_id, duration_min, price_cents, currency, status, notes)
      values (
        ${id}, ${data.artistId}, ${context.userId},
        ${svc[0].duration_min}, ${svc[0].price_cents}, ${svc[0].currency},
        'live', 'Booked by fan'
      )
    `;
    return { id };
  });

export const startVideoCall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const row = await sql<{ artist_id: string; fan_id: string | null; status: string }>`
      select artist_id, fan_id, status from video_chat_sessions where id = ${id} limit 1
    `;
    if (!row[0]) throw new Error("Room not found");
    if (row[0].artist_id !== context.userId && row[0].fan_id !== context.userId && row[0].fan_id) {
      throw new Error("This room is taken");
    }
    if (row[0].status === "ended") throw new Error("This call already ended");
    if (row[0].artist_id !== context.userId && !row[0].fan_id) {
      await sql`
        update video_chat_sessions set fan_id = ${context.userId}, status = 'live', notes = 'Fan joined'
        where id = ${id}
      `;
    } else {
      await sql`update video_chat_sessions set status = 'live' where id = ${id}`;
    }
    return { ok: true };
  });

export const endVideoCall = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const row = await sql<{ artist_id: string; fan_id: string | null }>`
      select artist_id, fan_id from video_chat_sessions where id = ${id} limit 1
    `;
    if (!row[0]) throw new Error("Room not found");
    if (row[0].artist_id !== context.userId && row[0].fan_id !== context.userId) {
      throw new Error("Not in this room");
    }
    await sql`
      update video_chat_sessions set status = 'ended', notes = 'Call ended'
      where id = ${id}
    `;
    return { ok: true };
  });

export const listOpenVideoRooms = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql.query<Record<string, unknown>>(
    `${SESSION_SQL}
     where s.status in ('waiting','live')
     order by s.created_at desc
     limit 12`,
  );
  return rows.map(mapSession);
});
