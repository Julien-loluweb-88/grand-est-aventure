import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Liens internes / externes dans les documents légaux */
export const legalLinkClass =
  "font-medium text-[#39951a] underline underline-offset-2 decoration-[#281401]/20 transition-colors hover:text-[#281401] hover:decoration-[#68a618]/70";

const shellOuter =
  "mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:max-w-4xl";

const articleCard =
  "min-w-0 max-w-full rounded-2xl border border-[#281401]/10 bg-linear-to-br from-white/95 via-[#fffaeb] to-[#fef0c7]/35 px-5 py-10 font-sans shadow-sm sm:px-8 sm:py-12 md:px-10 md:py-14";

const listClass =
  "ms-1 list-inside list-disc space-y-3 marker:text-[#68a618] sm:ms-4";

export function LegalPageShell({
  title,
  lead,
  children,
}: {
  title: string;
  lead: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={shellOuter}>
      <article className={articleCard}>
        <header className="min-w-0 border-b border-[#281401]/10 pb-8 sm:pb-10">
          <h1 className="hyphens-auto wrap-break-word text-3xl font-bold tracking-tight text-[#281401] sm:text-4xl">
            {title}
          </h1>
          <div className="mt-4 min-w-0 max-w-prose text-pretty text-sm leading-relaxed text-[#281401]/80 sm:text-base">
            {lead}
          </div>
        </header>
        <div className="pt-8 sm:pt-10">{children}</div>
      </article>
    </div>
  );
}

/** Sommaire (ex. CGU) — grille responsive */
export function LegalTableOfContents({
  title = "Sommaire",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <nav
      aria-label="Sommaire des sections"
      className="rounded-xl border border-[#281401]/10 bg-[#fef0c7]/45 p-4 shadow-sm sm:p-6"
    >
      <p className="text-sm font-semibold text-[#281401] sm:text-base">
        {title}
      </p>
      <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2 sm:text-[0.9375rem]">
        {children}
      </ul>
    </nav>
  );
}

export function LegalTocItem({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li className="min-w-0">
      <a href={href} className={cn(legalLinkClass, "inline-block py-0.5")}>
        {children}
      </a>
    </li>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="hyphens-auto wrap-break-word border-b border-[#281401]/12 pb-3 text-xl font-semibold tracking-tight text-[#39951a] sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 min-w-0 space-y-4 text-sm leading-relaxed text-[#281401]/90 sm:text-base sm:leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export function LegalFooterNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-12 rounded-xl border border-[#281401]/10 bg-[#fef0c7]/35 px-4 py-4 text-sm leading-relaxed text-[#281401]/80 sm:px-5 sm:text-base">
      {children}
    </p>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className={listClass}>{children}</ul>;
}
