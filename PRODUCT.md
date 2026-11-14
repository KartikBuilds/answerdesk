# Answerdesk — product brief and definition of done

## The buyer
A SaaS company or small business with a help center or documentation, whose support inbox is full of
questions the docs already answer.

**What they're hiring for:** "An AI assistant on our docs that answers correctly and never makes things up about our product."
**What makes them trust me:** answers that cite sources, an honest "I don't know", a measured accuracy score, and cost control.

## Job to be done
Let customers ask questions in their own words and get correct, sourced answers, and show the business which
questions their docs don't cover.

## Scope
- Ask box with streamed, cited answers; honest "not found" below a confidence threshold.
- Bring your own docs: add pages by upload (Markdown/PDF) or website link; they are chunked and indexed.
- Embeddable chat widget: one script tag for any website.
- Insights: questions asked, unanswered questions, thumbs up/down feedback.
- Usage and cost limits per visitor and per site.

## Non-goals
Multi-tenant billing, live human handoff, voice.

## Definition of done

| Aspect | Done means |
| --- | --- |
| Product | Answers stream in under 2 seconds to first word; citations link to the exact section; unknown questions get "not found"; the widget works on a plain HTML page; owners can see unanswered questions. |
| Code | Strict TypeScript; retrieval, prompting and policy in separate tested modules; no provider lock-in in business logic. |
| Security | Written threat model including prompt injection; content uploaded only by admins; no secret keys in the browser; per-visitor and site-wide limits in the database; security headers; dependency scanning in CI. |
| Testing | Unit, database and browser tests in CI; retrieval evaluation (≥ 30 questions, top-3 hit rate ≥ 95%); answer evaluation (≥ 30 questions: cites a correct source, no invented numbers), results published in the README. |
| Reliability | Error monitoring with alerts; uptime check; health endpoint; falls back to quoting sources if the model is unavailable; model warm-up so first answers aren't slow. |
| Performance | Lighthouse mobile ≥ 95 / 100 / 100 / ≥ 95; time to first answer token measured and recorded. |
| Accessibility | WCAG 2.1 AA: answers announced to screen readers, keyboard-only use, contrast; automated axe checks in CI. |
| Design | House style; clear sources; feedback buttons; polished loading, empty, limit-reached and error states. |
| Delivery | Preview deployment per change; clean history; short production address. |
| Documentation | README: problem, result, proof, architecture diagram (ingest → index → retrieve → answer), evaluation results, cost per 1,000 questions, how to run/test/deploy, decision log. |
| Proof | Live demo, public code, published evaluation scores. A deployment on real documentation when available. |
