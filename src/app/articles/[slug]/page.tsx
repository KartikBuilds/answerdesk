import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getArticle, loadArticles } from "@/lib/content";

const anchor = (heading: string) => heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function generateStaticParams() {
  return loadArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const article = getArticle((await params).slug);
  return { title: article ? `${article.title} | Ledgerly Help Center` : "Not found" };
}

export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <Link href="/" className="text-sm text-ink-soft underline-offset-4 hover:underline">Help Center</Link>
        <p className="mt-6 text-sm font-medium text-pass">{article.category}</p>
        <h1 className="mt-1 font-display text-4xl font-extrabold">{article.title}</h1>
        {article.intro && <p className="mt-5 text-lg text-ink-soft">{article.intro}</p>}
        {article.sections.map((s) => (
          <section key={s.heading} id={anchor(s.heading)} className="mt-10 scroll-mt-6">
            <h2 className="font-display text-2xl font-semibold">{s.heading}</h2>
            <p className="mt-3 leading-relaxed">{s.body}</p>
          </section>
        ))}
        <div className="mt-14 rounded-xl border border-rule bg-sheet p-6">
          <p className="font-semibold">Still have a question?</p>
          <Link href="/" className="btn btn-ghost mt-3">Ask the help assistant</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
