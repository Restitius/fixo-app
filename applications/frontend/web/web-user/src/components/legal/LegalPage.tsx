import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { AuthBrand } from "@/components/auth/AnimatedAuthShell";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** Public, readable-without-an-account page used for the Terms and the Privacy Policy. */
export function LegalPage({
  title,
  intro,
  updated,
  sections,
}: {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 pt-8">
        <AuthBrand compact />
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to FIXO
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20 pt-10">
        <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>
        <p className="mt-6 text-base leading-7 text-foreground/80">{intro}</p>

        <nav aria-label="Contents" className="mt-8 rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold">Contents</p>
          <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a className="text-primary hover:underline" href={`#${s.id}`}>
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold">
                {i + 1}. {s.title}
              </h2>
              <div className="mt-3 space-y-3 text-base leading-7 text-foreground/80">{s.body}</div>
            </section>
          ))}
        </div>

        <p className="mt-14 rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
          This page summarises how FIXO works today. If anything here conflicts with a signed
          agreement or applicable law, the agreement or the law prevails. Questions? Contact FIXO
          support from the Help page.
        </p>
      </main>
    </div>
  );
}
