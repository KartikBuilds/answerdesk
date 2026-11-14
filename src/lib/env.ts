import { z } from "zod";
import { PUBLIC_SUPABASE_KEY, PUBLIC_SUPABASE_URL } from "./public-config";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type Env = z.infer<typeof schema>;

/** Validates configuration once and fails fast with a readable message. */
export function getEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = schema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: PUBLIC_SUPABASE_KEY,
    ...Object.fromEntries(Object.entries(source).filter(([k, v]) => k.startsWith("NEXT_PUBLIC_SUPABASE") && v)),
  });
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
  if (/service_role|sb_secret_/.test(parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    throw new Error("Invalid environment: a secret key must never be used as the public key");
  }
  return parsed.data;
}
