import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { NOT_FOUND, SYSTEM_PROMPT, buildPrompt, extractiveAnswer, isAnswerable, questionSchema, selectSources, type Match } from "@/lib/answer";
import { db } from "@/lib/db";
import { visitorId } from "@/lib/visitor";

export const maxDuration = 30;

const MODEL = process.env.GOOGLE_GENERATIVE_AI_API_KEY ? google("gemini-2.5-flash") : "openai/gpt-4o-mini";

const json = (body: unknown, status = 200) => Response.json(body, { status });

export async function POST(request: Request) {
  const parsed = questionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
  const { question } = parsed.data;

  const supabase = db();
  const { data: allowed, error: quotaError } = await supabase.rpc("ad_take_quota", { p_visitor: visitorId(request.headers) });
  if (quotaError) return json({ error: "The assistant is unavailable right now. Browse the articles below instead." }, 503);
  if (!allowed) return json({ error: "You've reached today's question limit for this demo. Try again tomorrow, or browse the articles below." }, 429);

  let vector: number[];
  try {
    // Loaded on demand so a model problem degrades to a clear message instead of a crashed route.
    const { embed } = await import("@/lib/embed");
    [vector] = await embed([question]);
  } catch (e) {
    console.error("embedding failed", e);
    return json({ error: "Search is unavailable right now. Browse the articles below instead."}, 503);
  }
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
  });
  const meta = sources.map(({ slug, title, heading }) => ({ slug, title, heading }));

  // Wait for the first piece of text, so a model failure becomes a clean fallback instead of an empty answer.
  const parts = result.fullStream[Symbol.asyncIterator]();
  let first = "";
  try {
    for (;;) {
      const { value, done } = await parts.next();
      if (done) break;
      if (value.type === "error") throw value.error;
      if (value.type === "text-delta") { first = value.text; break; }
    }
  } catch (e) {
    console.error("answer generation failed", e);
    // Model unavailable (for example, no credit): answer from the best passage instead.
    return json({ answer: extractiveAnswer(sources), sources: meta, mode: "quote" });
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) { if (first) controller.enqueue(encoder.encode(first)); },
    async pull(controller) {
      try {
        const { value, done } = await parts.next();
        if (done) return controller.close();
        if (value.type === "text-delta") controller.enqueue(encoder.encode(value.text));
        if (value.type === "error") throw value.error;
      } catch (e) {
        console.error("answer stream failed", e);
        controller.close();
      }
    },
  });
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "x-sources": encodeURIComponent(JSON.stringify(meta)) } });
}
