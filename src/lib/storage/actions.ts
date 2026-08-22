import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { newId } from "@/lib/utils";
import type { S3BucketKind } from "@/lib/infra/env";

export type UploadKind = "cover" | "poster" | "master";

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const AUDIO_MIME = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  "audio/flac",
  "audio/ogg",
  "audio/webm",
]);

const LIMITS: Record<UploadKind, { bucket: S3BucketKind; max: number; types: Set<string> }> = {
  cover: { bucket: "public", max: 8 * 1024 * 1024, types: IMAGE_MIME },
  poster: { bucket: "public", max: 8 * 1024 * 1024, types: IMAGE_MIME },
  master: { bucket: "masters", max: 80 * 1024 * 1024, types: AUDIO_MIME },
};

function extFor(mime: string, filename: string): string {
  const fromName = filename.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/mp4": "m4a",
    "audio/m4a": "m4a",
    "audio/x-m4a": "m4a",
    "audio/aac": "aac",
    "audio/flac": "flac",
    "audio/ogg": "ogg",
    "audio/webm": "weba",
  };
  return map[mime] ?? "bin";
}

function objectKey(userId: string, kind: UploadKind, id: string, ext: string): string {
  const year = new Date().getUTCFullYear();
  if (kind === "cover") return `covers/${userId}/${year}/${id}.${ext}`;
  if (kind === "poster") return `posters/${userId}/${year}/${id}.${ext}`;
  return `${userId}/${year}/${id}.${ext}`;
}

export const requestUpload = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { kind: UploadKind; mime: string; size: number; filename: string }) => d)
  .handler(async ({ context, data }) => {
    const spec = LIMITS[data.kind];
    if (!spec) throw new Error("Unknown upload type");
    const mime = data.mime.toLowerCase();
    if (!spec.types.has(mime)) throw new Error(`File type ${data.mime} is not allowed`);
    if (!Number.isFinite(data.size) || data.size <= 0) throw new Error("Empty file");
    if (data.size > spec.max) {
      const mb = Math.round(spec.max / (1024 * 1024));
      throw new Error(`File must be under ${mb} MB`);
    }
    const { getSql } = await import("@/lib/db");
    const { S3_BUCKETS } = await import("@/lib/infra/env");
    const { presignPut, storageMode } = await import("./driver");
    const sql = await getSql();
    const artist = await sql<{ user_id: string }>`
      select user_id from artist_profiles where user_id = ${context.userId} limit 1
    `;
    if (!artist[0]) throw new Error("Become an artist first");
    const id = newId("media");
    const key = objectKey(context.userId, data.kind, id, extFor(mime, data.filename || ""));
    const token = newId("up").replace(/^up_/, "") + newId("t").replace(/^t_/, "");
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const bucket = S3_BUCKETS[spec.bucket];
    await sql`
      insert into media_objects (
        id, owner_id, bucket, bucket_kind, object_key, mime, size_bytes, kind, status, upload_token, expires_at
      ) values (
        ${id}, ${context.userId}, ${bucket}, ${spec.bucket}, ${key}, ${mime}, ${data.size},
        ${data.kind}, 'pending', ${token}, ${expires}
      )
    `;
    const awsUrl = await presignPut({ kind: spec.bucket, key, mime });
    const putUrl = awsUrl ?? `/api/storage/upload?token=${encodeURIComponent(token)}`;
    return {
      mediaId: id,
      putUrl,
      putHeaders: { "content-type": mime },
      bucket: spec.bucket,
      key,
      mode: storageMode(),
    };
  });

export const completeUpload = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { mediaId: string }) => d)
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const { S3_BUCKETS } = await import("@/lib/infra/env");
    const { copyObject, objectExists, objectStat } = await import("./driver");
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      owner_id: string;
      bucket_kind: S3BucketKind;
      object_key: string;
      kind: UploadKind;
      mime: string;
      status: string;
    }>`
      select id, owner_id, bucket_kind, object_key, kind, mime, status
      from media_objects
      where id = ${data.mediaId} and owner_id = ${context.userId}
      limit 1
    `;
    const row = rows[0];
    if (!row) throw new Error("Upload not found");
    const exists = await objectExists(row.bucket_kind, row.object_key);
    if (!exists) throw new Error("File never landed — try again");
    const st = await objectStat(row.bucket_kind, row.object_key);
    const size = st?.size ?? 0;
    await sql`
      update media_objects
      set status = 'ready', size_bytes = ${size}, upload_token = null, expires_at = null
      where id = ${row.id}
    `;
    let playId = row.id;
    if (row.kind === "master") {
      await copyObject({ from: "masters", to: "stream", key: row.object_key });
      const streamBucket = S3_BUCKETS.stream;
      const streamRow = await sql<{ id: string }>`
        insert into media_objects (
          id, owner_id, bucket, bucket_kind, object_key, mime, size_bytes, kind, status
        ) values (
          ${newId("media")}, ${context.userId}, ${streamBucket}, 'stream', ${row.object_key},
          ${row.mime}, ${size}, 'stream', 'ready'
        )
        on conflict (bucket, object_key) do update set
          status = 'ready',
          size_bytes = excluded.size_bytes,
          mime = excluded.mime
        returning id
      `;
      playId = streamRow[0]?.id ?? playId;
    }
    const url = `/api/storage/media/${playId}`;
    await sql`update media_objects set public_url = ${url} where id = ${playId}`;
    if (playId !== row.id) {
      const masterUrl = `/api/storage/media/${row.id}`;
      await sql`update media_objects set public_url = ${masterUrl} where id = ${row.id}`;
    }
    return { mediaId: playId, sourceId: row.id, url, kind: row.kind, bytes: size };
  });
