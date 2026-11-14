import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";

/** Liveness and database reachability, for uptime monitoring. Reveals nothing sensitive. */
export async function GET() {
  const started = Date.now();
  const env = getEnv();
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { error } = await db.rpc("ad_take_quota", { p_visitor: "health" }).then((r) => ({ error: r.error && r.error.code !== "P0001" ? r.error : null }));
  const body = { status: error ? "degraded" : "ok", database: error ? "unreachable" : "ok", latencyMs: Date.now() - started };
  return Response.json(body, { status: error ? 503 : 200, headers: { "cache-control": "no-store" } });
}
