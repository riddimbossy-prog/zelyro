import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl,
} from "@/lib/infra/env";

const globalRef = globalThis as typeof globalThis & {
  __zelyroSupabaseAdmin__?: SupabaseClient | null;
  __zelyroSupabaseAnon__?: SupabaseClient | null;
};

/**
 * Service-role client. Bypasses RLS. Server-only — never ship this key.
 * Null when Supabase is not configured (live preview uses PGLite instead).
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = supabaseUrl();
  const key = supabaseServiceRoleKey();
  if (!url || !key) return null;
  globalRef.__zelyroSupabaseAdmin__ ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return globalRef.__zelyroSupabaseAdmin__;
}

/** Anon client (RLS on). Server-side reads of public catalog. */
export function getSupabaseAnon(): SupabaseClient | null {
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) return null;
  globalRef.__zelyroSupabaseAnon__ ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return globalRef.__zelyroSupabaseAnon__;
}

export async function pingSupabase(): Promise<{ ok: boolean; error?: string }> {
  const admin = getSupabaseAdmin() ?? getSupabaseAnon();
  if (!admin) return { ok: false, error: "not configured" };
  try {
    const { error } = await admin.from("tracks").select("id", { count: "exact", head: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unreachable" };
  }
}
