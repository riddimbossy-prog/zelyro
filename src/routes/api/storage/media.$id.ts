import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { presignGet, readObject, storageMode } from "@/lib/storage/driver";
import type { S3BucketKind } from "@/lib/infra/env";

export const Route = createFileRoute("/api/storage/media/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id;
        if (!id) return new Response("Not found", { status: 404 });
        const sql = await getSql();
        const rows = await sql<{
          id: string;
          bucket_kind: S3BucketKind;
          object_key: string;
          mime: string;
          status: string;
        }>`
          select id, bucket_kind, object_key, mime, status
          from media_objects
          where id = ${id}
          limit 1
        `;
        const row = rows[0];
        if (!row || row.status !== "ready") return new Response("Not found", { status: 404 });
        if (row.bucket_kind === "masters") {
          return new Response("Masters are private", { status: 403 });
        }
        if (storageMode() === "aws") {
          const signed = await presignGet({
            kind: row.bucket_kind,
            key: row.object_key,
            expiresSec: 3600,
          });
          if (!signed) return new Response("Unavailable", { status: 503 });
          return Response.redirect(signed, 302);
        }
        const obj = await readObject(row.bucket_kind, row.object_key);
        if (!obj) return new Response("Missing object", { status: 404 });
        return new Response(new Uint8Array(obj.body), {
          status: 200,
          headers: {
            "content-type": row.mime || obj.mimeHint || "application/octet-stream",
            "cache-control":
              row.bucket_kind === "public" ? "public, max-age=86400" : "private, max-age=3600",
            "content-length": String(obj.body.byteLength),
          },
        });
      },
    },
  },
});
