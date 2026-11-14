import { describe, expect, it } from "vitest";
import { MIN_SIMILARITY, buildPrompt, extractiveAnswer, isAnswerable, questionSchema, selectSources, type Match } from "@/lib/answer";

const m = (slug: string, heading: string, similarity: number): Match => ({ slug, title: slug, heading, content: `${slug} ${heading}`, similarity });

describe("answer policy", () => {
  it("does not call the model when nothing relevant was found", () => {
    expect(isAnswerable([])).toBe(false);
    expect(isAnswerable([m("a", "b", MIN_SIMILARITY - 0.01)])).toBe(false);
    expect(isAnswerable([m("a", "b", MIN_SIMILARITY + 0.1)])).toBe(true);
  });
  it("keeps the strongest distinct sources, at most four", () => {
    const picked = selectSources([m("a", "x", 0.8), m("a", "x", 0.79), m("b", "y", 0.7), m("c", "z", 0.6), m("d", "w", 0.5), m("e", "v", 0.45), m("f", "u", 0.1)]);
    expect(picked.map((p) => p.slug)).toEqual(["a", "b", "c", "d"]);
  });
  it("numbers sources so answers can cite them", () => {
    expect(buildPrompt("How?", [m("a", "x", 0.9), m("b", "y", 0.8)])).toMatch(/\[1\] a > x[\s\S]*\[2\] b > y[\s\S]*Question: How\?/);
  });
  it("validates question length", () => {
    expect(questionSchema.safeParse({ question: "hi" }).success).toBe(false);
    expect(questionSchema.safeParse({ question: "x".repeat(301) }).success).toBe(false);
    expect(questionSchema.safeParse({ question: "How do refunds work?" }).success).toBe(true);
  });
});

import { visitorId } from "@/lib/visitor";

describe("visitorId", () => {
  const h = (ip: string) => new Headers({ "x-forwarded-for": `${ip}, 10.0.0.1` });
  const day = new Date("2030-01-01T10:00:00Z");
  it("is a 64-character hash that never contains the IP", () => {
    const id = visitorId(h("203.0.113.9"), day);
    expect(id).toMatch(/^[a-f0-9]{64}$/);
    expect(id).not.toContain("203");
  });
  it("is stable within a day and changes the next day", () => {
    expect(visitorId(h("203.0.113.9"), day)).toBe(visitorId(h("203.0.113.9"), new Date("2030-01-01T23:00:00Z")));
    expect(visitorId(h("203.0.113.9"), day)).not.toBe(visitorId(h("203.0.113.9"), new Date("2030-01-02T10:00:00Z")));
  });
});

describe("extractiveAnswer", () => {
  it("quotes the best section and cites it", () => {
    const best = { slug: "plans", title: "Plans and pricing", heading: "Pro plan", content: "Plans and pricing — Pro plan\nPro costs 12 USD per month.", similarity: 0.8 };
    expect(extractiveAnswer([best])).toBe('From "Plans and pricing" (Pro plan): Pro costs 12 USD per month. [1]');
  });
});
