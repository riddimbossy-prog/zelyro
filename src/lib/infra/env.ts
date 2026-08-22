/**
 * Server-only infrastructure env. Never import from client components.
 * Secrets stay here — status helpers expose hostnames / modes only.
 */

export function postgresUrl(): string | undefined {
  const raw =
    process.env.DATABASE_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.SUPABASE_DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    "";
  return raw || undefined;
}

export function supabaseUrl(): string | undefined {
  const raw = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim() || "";
  return raw || undefined;
}

export function supabaseAnonKey(): string | undefined {
  const raw =
    process.env.SUPABASE_ANON_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim() || "";
  return raw || undefined;
}

export function supabaseServiceRoleKey(): string | undefined {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  return raw || undefined;
}

export function hostnameOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export const S3_BUCKETS = {
  masters: process.env.S3_MASTERS_BUCKET?.trim() || "verzzify-masters",
  stream: process.env.S3_STREAM_BUCKET?.trim() || "verzzify-stream",
  public: process.env.S3_PUBLIC_BUCKET?.trim() || "verzzify-public",
} as const;

export type S3BucketKind = keyof typeof S3_BUCKETS;

export function awsRegion(): string {
  return process.env.AWS_REGION?.trim() || process.env.S3_REGION?.trim() || "eu-west-1";
}

export function s3Endpoint(): string | undefined {
  const raw = process.env.S3_ENDPOINT?.trim() || "";
  return raw || undefined;
}

export function awsConfigured(): boolean {
  return Boolean(process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim());
}

export function localS3Root(): string {
  return process.env.S3_LOCAL_DIR?.trim() || "/workspace/.data/s3";
}
