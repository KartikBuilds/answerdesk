import Link from "next/link";
import { AskBox } from "@/components/ask-box";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { loadArticles } from "@/lib/content";

export default function Home() {
  const articles = loadArticles();
  const categories = [...new Set(articles.map((a) => a.category))];
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-14">
        <h1 className="max-w-2xl font-display text-4xl font-extrabold md:text-5xl">How can we help?</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">Ask in your own words. Answers come only from the articles below, with links to each source.</p>
        <div className="mt-8"><AskBox /></div>

        <section aria-labelledby="browse" className="mt-16">
          <h2 id="browse" className="font-display text-2xl font-semibold">Browse articles</h2>
          <div className="mt-6 grid gap-10 md:grid-cols-2">
            {categories.map((c) => (
              <div key={c}>
                <h3 className="border-b border-rule pb-2 font-display text-lg font-semibold">{c}</h3>
                <ul className="mt-3 space-y-2">
                  {articles.filter((a) => a.category === c).map((a) => (
                    <li key={a.slug}><Link href={`/articles/${a.slug}`} className="hover:text-pass hover:underline underline-offset-4">{a.title}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
