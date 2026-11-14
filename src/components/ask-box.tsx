"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type Source = { slug: string; title: string; heading: string };
type State =
  | { kind: "idle" }
  | { kind: "loading"; question: string }
  | { kind: "answer"; question: string; text: string; sources: Source[]; done: boolean }
  | { kind: "error"; question: string; message: string };

const EXAMPLES = ["How much does Pro cost?", "When do card payments reach my bank?", "Can I refund part of a payment?", "How do I add GST to invoices?"];

const anchor = (heading: string) => heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Turns "[2]" markers into links to the cited article section. */
function Cited({ text, sources }: { text: string; sources: Source[] }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <>
      {parts.map((p, i) => {
        const n = p.match(/^\[(\d+)\]$/)?.[1];
        const s = n ? sources[Number(n) - 1] : undefined;
        if (!s) return <span key={i}>{p}</span>;
        return (
          <Link key={i} href={`/articles/${s.slug}#${anchor(s.heading)}`} title={`${s.title}: ${s.heading}`}
            className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-pass-tint px-1 align-text-top text-xs font-semibold text-pass hover:bg-pass hover:text-white">
            {n}
          </Link>
        );
      })}
    </>
  );
}

export function AskBox() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const input = useRef<HTMLInputElement>(null);

  async function ask(question: string) {
    if (state.kind === "loading" || (state.kind === "answer" && !state.done)) return;
    setState({ kind: "loading", question });
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }) });
      if (res.headers.get("content-type")?.includes("application/json")) {
        const body = await res.json();
        const related = (body.sources ?? []).map((s: Source) => `\n• ${s.title}: ${s.heading}`).join("");
        setState(body.error ? { kind: "error", question, message: body.error + related } : { kind: "answer", question, text: body.answer, sources: [], done: true });
        return;
      }
      const sources: Source[] = JSON.parse(decodeURIComponent(res.headers.get("x-sources") ?? "%5B%5D"));
      const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
      let text = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        text += value;
        setState({ kind: "answer", question, text, sources, done: false });
      }
      setState(text.trim()
        ? { kind: "answer", question, text, sources, done: true }
        : { kind: "error", question, message: "The assistant couldn't answer just now. These articles look relevant:" + sources.map((s) => `\n• ${s.title}`).join("") });
    } catch {
      setState({ kind: "error", question, message: "Something went wrong reaching the assistant. Check your connection and try again." });
    }
  }

  const busy = state.kind === "loading" || (state.kind === "answer" && !state.done);

  return (
    <div>
      <form
        onSubmit={(e) => { e.preventDefault(); const q = input.current?.value.trim(); if (q) ask(q); }}
        className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="question" className="sr-only">Your question</label>
        <input ref={input} id="question" name="question" required minLength={4} maxLength={300} autoComplete="off"
          placeholder="Ask anything about invoices, payments or your account" className="field flex-1 py-3 text-lg" />
        <button disabled={busy} className="btn btn-primary px-6 py-3 disabled:opacity-60">{busy ? "Answering…" : "Ask"}</button>
      </form>

      {state.kind === "idle" && (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Example questions">
          {EXAMPLES.map((q) => (
            <button key={q} type="button" onClick={() => { if (input.current) input.current.value = q; ask(q); }}
              className="cursor-pointer rounded-full border border-rule bg-sheet px-3 py-1.5 text-sm text-ink-soft hover:border-ink-soft hover:text-ink">
              {q}
            </button>
          ))}
        </div>
      )}

      <div aria-live="polite">
        {state.kind !== "idle" && (
          <section aria-label="Answer" className="mt-6 rounded-xl border border-rule bg-sheet p-6">
            <p className="text-sm font-medium text-ink-soft">{state.question}</p>
            {state.kind === "loading" && <p className="mt-3 text-ink-soft">Searching the help center…</p>}
            {state.kind === "error" && <p role="alert" className="mt-3 whitespace-pre-line text-caution">{state.message}</p>}
            {state.kind === "answer" && (
              <>
                <p className="mt-3 whitespace-pre-line text-lg leading-relaxed"><Cited text={state.text} sources={state.sources} /></p>
                {state.done && state.sources.length > 0 && (
                  <div className="mt-5 border-t border-rule pt-4">
                    <h2 className="text-sm font-semibold">Sources</h2>
                    <ol className="mt-2 space-y-1 text-sm">
                      {state.sources.map((s, i) => (
                        <li key={i}>
                          <span className="mr-2 font-semibold text-pass">{i + 1}</span>
                          <Link href={`/articles/${s.slug}#${anchor(s.heading)}`} className="underline underline-offset-4 hover:text-pass">{s.title}: {s.heading}</Link>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
