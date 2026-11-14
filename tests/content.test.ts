import { describe, expect, it } from "vitest";
import { chunkArticle, loadArticles, parseArticle } from "@/lib/content";

describe("help articles", () => {
  it("all parse, with unique slugs and at least one section", () => {
    const articles = loadArticles();
    expect(articles.length).toBeGreaterThanOrEqual(14);
    expect(new Set(articles.map((a) => a.slug)).size).toBe(articles.length);
    for (const a of articles) expect(a.sections.length).toBeGreaterThan(0);
  });
  it("rejects an article without front matter", () => {
    expect(() => parseArticle("x", "## Heading\nbody")).toThrow(/front matter/);
  });
  it("makes self-contained chunks that carry their titles", () => {
    const a = parseArticle("demo", "---\ntitle: Demo\ncategory: Basics\n---\nIntro text.\n\n## Part one\nBody one.\n\n## Part two\nBody two.\n");
    const chunks = chunkArticle(a);
    expect(chunks.map((c) => c.heading)).toEqual(["Overview", "Part one", "Part two"]);
    expect(chunks[1].content).toBe("Demo — Part one\nBody one.");
  });
});
