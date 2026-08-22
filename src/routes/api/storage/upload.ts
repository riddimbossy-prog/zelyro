import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { putObject } from "@/lib/storage/driver";
import type { S3BucketKind } from "@/lib/infra/env";

const ALLOWED = new Set(["masters", "stream", "public"]);

export const Route = createFileRoute("/api/storage/upload")({
  server: {
    handlers: {
      OPTIONS: () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "PUT, OPTIONS",
            "access-control-allow-headers": "content-type",
          },
        }),
      PUT: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token")?.trim();
        if (!token) return json({ error: "Missing upload token" }, 400);
        const sql = await getSql();
        const rows = await sql<{
          id: string;
          bucket_kind: string;
          object_key: string;
          mime: string;
          size_bytes: number;
          status: string;
          expires_at: Date | string | null;
        }>`
          select id, bucket_kind, object_key, mime, size_bytes, status, expires_at
          from media_objects
          where upload_token = ${token}
          limit 1
        `;
        const row = rows[0];
        if (!row || row.status !== "pending") return json({ error: "Invalid or used token" }, 403);
        if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
          return json({ error: "Upload token expired" }, 403);
        }
        if (!ALLOWED.has(row.bucket_kind)) return json({ error: "Bad bucket" }, 400);
        const buf = Buffer.from(await request.arrayBuffer());
        if (buf.byteLength === 0) return json({ error: "Empty body" }, 400);
        if (buf.byteLength > row.size_bytes * 1.1 + 2048) {
          return json({ error: "File larger than signed size" }, 413);
        }
        await putObject({
          kind: row.bucket_kind as S3BucketKind,
          key: row.object_key,
          body: buf,
          mime: row.mime,
        });
        return json({ ok: true, bytes: buf.byteLength }, 200);
      },
    },
  },
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
  });
}
