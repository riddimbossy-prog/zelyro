import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { getInfraStatus } from "@/lib/infra/status";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const sql = await getSql();
          const counts = await sql<{ tracks: number; artists: number }>`
            select
              (select count(*) from tracks) as tracks,
              (select count(*) from artist_profiles) as artists
          `;
          const sample = await sql<{ id: string; play_count: number; title: string }>`
            select id, play_count, title from tracks order by play_count desc limit 3
          `;
          const infra = await getInfraStatus();
          return Response.json({
            ok: true,
            tracks: Number(counts[0]?.tracks ?? 0),
            artists: Number(counts[0]?.artists ?? 0),
            sample,
            infra,
          });
        } catch (err) {
          return Response.json(
            { ok: false, error: String(err), stack: err instanceof Error ? err.stack : null },
            { status: 500 },
          );
        }
      },
    },
  },
});
