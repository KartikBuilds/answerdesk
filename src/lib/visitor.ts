import { createHash } from "node:crypto";

/** A daily-rotating, one-way visitor id. The raw IP address is never stored. */
export function visitorId(headers: Headers, now = new Date()): string {
  const ip = headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
  const day = now.toISOString().slice(0, 10);
  return createHash("sha256").update(`answerdesk:${day}:${ip}`).digest("hex");
}
