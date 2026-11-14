import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";

/** Public client: it can only call the two database functions the migration exposes. */
export function db() {
  const env = getEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
}
