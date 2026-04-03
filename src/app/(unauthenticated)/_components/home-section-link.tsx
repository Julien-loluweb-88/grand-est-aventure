"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const HOME_HASH = /^\/#([\w-]+)$/;

/**
 * Liens d’ancre vers la page d’accueil : défilement fluide si on est déjà sur `/`,
 * sinon navigation classique (le `scroll-smooth` sur `html` aide au chargement).
 */
export function HomeSectionLink({
  href,
  className,
  children,
  onAfterNavigate,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  /** Ex. fermer un menu mobile après clic. */
  onAfterNavigate?: () => void;
}) {
  const pathname = usePathname();
  const match = href.match(HOME_HASH);
  const sectionId = match?.[1];

  return (
    <Link
      href={href}
      className={className}
      scroll={false}
      onClick={(e) => {
        if (sectionId && pathname === "/") {
          e.preventDefault();
          const smooth =
            typeof window !== "undefined" &&
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          document.getElementById(sectionId)?.scrollIntoView({
            behavior: smooth ? "smooth" : "auto",
            block: "start",
          });
          window.history.replaceState(null, "", href);
        }
        onAfterNavigate?.();
      }}
    >
      {children}
    </Link>
  );
}
