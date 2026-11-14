import { streamText } from "ai";
import { NOT_FOUND, SYSTEM_PROMPT, buildPrompt, isAnswerable, questionSchema, selectSources, type Match } from "@/lib/answer";
import { db } from "@/lib/db";
import { embed } from "@/lib/embed";
import { visitorId } from "@/lib/visitor";

export const maxDuration = 30;

const MODEL = "google/gemini-2.5-flash-lite";

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function POST(request: Request) {
  const parsed = questionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
  const { question } = parsed.data;

  const supabase = db();
  const { data: allowed, error: quotaError } = await supabase.rpc("ad_take_quota", { p_visitor: visitorId(request.headers) });
  if (quotaError) return json({ error: "The assistant is unavailable right now. Browse the articles below instead." }, 503);
  if (!allowed) return json({ error: "You've reached today's question limit for this demo. Try again tomorrow, or browse the articles below." }, 429);

  const [vector] = await embed([question]);
  const { data, error } = await supabase.rpc("ad_match", { p_embedding: `[${vector.join(",")}]`, p_count: 6 });
  if (error) return json({ error: "Search is unavailable right now. Browse the articles below instead." }, 503);

  const matches = (data ?? []) as Match[];
  if (!isAnswerable(matches)) return json({ answer: NOT_FOUND, sources: [] });

  const sources = selectSources(matches);
  const result = streamText({
    model: MODEL,
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(question, sources),
    maxOutputTokens: 350,
    temperature: 0.2,
    onError: ({ error: e }) => console.error("answer generation failed", e),
  });
  const meta = sources.map(({ slug, title, heading }) => ({ slug, title, heading }));
  return result.toTextStreamResponse({ headers: { "x-sources": encodeURIComponent(JSON.stringify(meta)) } });
}
