import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-rule bg-sheet">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl font-extrabold">Ledgerly <span className="font-sans text-base font-normal text-ink-soft">Help Center</span></Link>
        <a href="https://github.com/KartikBuilds/answerdesk" className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline">How it&apos;s built</a>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rule">
      <p className="mx-auto max-w-5xl px-6 py-6 text-sm text-ink-soft">
        Ledgerly is a fictional product. This help center and its assistant are a personal portfolio project by Kartik Shinde.
      </p>
    </footer>
  );
}
