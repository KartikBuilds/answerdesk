import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type Article = { slug: string; title: string; category: string; intro: string; sections: { heading: string; body: string }[] };
export type Chunk = { id: string; slug: string; title: string; heading: string; content: string };

const DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "content");

/** Parses one help article: a small front-matter block, an intro, then "## " sections. */
export function parseArticle(slug: string, raw: string): Article {
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) throw new Error(`${slug}: missing front matter`);
  const meta = Object.fromEntries(fm[1].split("\n").map((l) => [l.slice(0, l.indexOf(":")).trim(), l.slice(l.indexOf(":") + 1).trim()] as [string, string]));
  if (!meta.title || !meta.category) throw new Error(`${slug}: title and category are required`);
  const [intro, ...rest] = raw.slice(fm[0].length).split(/^## /m);
  const sections = rest.map((s) => {
    const [heading, ...body] = s.split("\n");
    return { heading: heading.trim(), body: body.join("\n").trim() };
  });
  return { slug, title: meta.title, category: meta.category, intro: intro.trim(), sections };
}

export function loadArticles(dir = DIR): Article[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => parseArticle(f.replace(/\.md$/, ""), readFileSync(path.join(dir, f), "utf8")));
}

export function getArticle(slug: string): Article | undefined {
  return loadArticles().find((a) => a.slug === slug);
}

/** One chunk per section (plus the intro), each prefixed with its titles so it stands on its own. */
export function chunkArticle(a: Article): Chunk[] {
  const parts = [...(a.intro ? [{ heading: "Overview", body: a.intro }] : []), ...a.sections];
  return parts.map((p, i) => ({
    id: `${a.slug}#${i}`,
    slug: a.slug,
    title: a.title,
    heading: p.heading,
    content: `${a.title} — ${p.heading}\n${p.body}`,
  }));
}
