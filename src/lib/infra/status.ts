import { createServerFn } from "@tanstack/react-start";
import type { InfraStatus } from "./types";

export type { InfraStatus };

export const getInfraStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<InfraStatus> => {
    const { dbSource } = await import("@/lib/db");
    const {
      S3_BUCKETS,
      awsConfigured,
      awsRegion,
      hostnameOf,
      s3Endpoint,
      supabaseAnonKey,
      supabaseServiceRoleKey,
      supabaseUrl,
    } = await import("@/lib/infra/env");
    const { pingS3, storageMode } = await import("@/lib/storage/driver");
    const { pingSupabase } = await import("@/lib/supabase/server");
    const { pingJamendo } = await import("@/lib/verzzify/jamendo");

    const s3 = await pingS3();
    const jamendo = await pingJamendo();
    const sbUrl = supabaseUrl();
    const sbConfigured = Boolean(sbUrl && (supabaseAnonKey() || supabaseServiceRoleKey()));
    let reachable: boolean | null = null;
    if (sbConfigured) {
      const ping = await pingSupabase();
      reachable = ping.ok;
    }
    return {
      postgres: {
        mode: dbSource === "pglite" ? "pglite" : "postgres",
        connected: true,
      },
      supabase: {
        configured: sbConfigured,
        host: hostnameOf(sbUrl),
        anon: Boolean(supabaseAnonKey()),
        serviceRole: Boolean(supabaseServiceRoleKey()),
        reachable,
      },
      s3: {
        mode: storageMode(),
        keysSet: awsConfigured(),
        region: awsRegion(),
        endpoint: s3Endpoint() ?? null,
        buckets: { ...S3_BUCKETS },
        reachable: s3.ok,
        error: s3.error,
      },
      jamendo,
    };
  },
);
