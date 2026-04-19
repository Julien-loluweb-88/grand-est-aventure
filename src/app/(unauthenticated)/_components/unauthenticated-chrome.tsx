"use client";

import Link from "next/link";
import { Suspense, useState, type ReactNode } from "react";
import { Facebook, Instagram, Menu } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { HomeSectionLink } from "./home-section-link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { publicSocialLinks } from "../_lib/public-social-links";
import { AuthCallbackQueryToasts } from "@/components/auth-callback-query-toasts";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.36-.698.772-1.362 1.225-1.993a.077.077 0 0 0-.041-.107 12.3 12.3 0 0 1-1.872-.892.077.077 0 0 1-.007-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

const socialIconClass =
  "size-5 transition-transform duration-200 group-hover:scale-110";

function SocialLink({
  href,
  label,
  children,
  className,
}: {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`group flex size-11 items-center justify-center rounded-full border border-[#281401]/12 bg-white/80 text-[#281401] shadow-sm transition hover:-translate-y-0.5 hover:border-[#68a618]/40 hover:bg-[#fef0c7] hover:shadow-md ${className ?? ""}`}
    >
      {children}
    </a>
  );
}

/** Gouttière légère (safe area) — le hero et le corps de page peuvent aller bord à bord. */
const pageGutterX = "px-3 sm:px-4 md:px-6";

const mobileNavLinkClass =
  "block rounded-md px-3 py-3 text-base text-[#281401] transition-colors hover:bg-[#fef0c7] active:bg-[#fef0c7]/80";

/** Même bandeau que l’accueil sur toutes les pages publiques (liens vers les ancres de `/`). */
function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={`sticky top-0 z-30 flex w-full items-center justify-between gap-2 border-b border-[#281401]/10 bg-[#fffaeb]/95 py-2 backdrop-blur-sm supports-backdrop-filter:bg-[#fffaeb]/90 sm:gap-x-5 sm:py-2.5 ${pageGutterX}`}
    >
      <Link
        href="/"
        className="flex min-w-0 flex-1 items-center gap-2.5 hover:opacity-90 md:flex-none md:gap-3"
        onClick={closeMobile}
      >
        <BrandMark height={38} className="bg-transparent" />
        <span className="truncate text-lg font-semibold tracking-tight sm:text-xl">
          Balad&apos;indice
        </span>
      </Link>

      <nav className="hidden items-center gap-x-5 text-[0.9375rem] md:flex">
        <HomeSectionLink href="/#comment-ca-marche" className="hover:underline">
          Comment ça marche ?
        </HomeSectionLink>
        <HomeSectionLink href="/#questions" className="hover:underline">
          Questions
        </HomeSectionLink>
        <HomeSectionLink href="/#reviews" className="hover:underline">
          Avis
        </HomeSectionLink>
          <HomeSectionLink
            href="/#cta-download"
            className="text-[#68a618] text-base font-semibold" 
            onAfterNavigate={closeMobile}>
            Télécharger l&apos;application
      </HomeSectionLink>
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="border-[#281401]/20 bg-white/70 text-[#281401] hover:bg-[#fef0c7] md:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-5" strokeWidth={2} />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="border-l-[#281401]/15 bg-[#fffaeb] text-[#281401] sm:max-w-xs"
          >
            <SheetHeader className="border-b border-[#281401]/10 text-left">
              <SheetTitle className="text-lg font-semibold text-[#281401]">
                Menu
              </SheetTitle>
              <SheetDescription className="sr-only">
                Liens vers les sections du site et téléchargement de
                l&apos;application
              </SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-0.5 px-2 py-4">
              <HomeSectionLink
                href="/#comment-ca-marche"
                className={mobileNavLinkClass}
                onAfterNavigate={closeMobile}
              >
                Comment ça marche ?
              </HomeSectionLink>
              <HomeSectionLink
                href="/#questions"
                className={mobileNavLinkClass}
                onAfterNavigate={closeMobile}
              >
                Questions
              </HomeSectionLink>
              <HomeSectionLink
                href="/#reviews"
                className={mobileNavLinkClass}
                onAfterNavigate={closeMobile}
              >
                Avis
              </HomeSectionLink>
              <HomeSectionLink
            href="/#cta-download"
            className="text-[#68a618] text-base font-semibold" 
              onAfterNavigate={closeMobile}>
                Télécharger l&apos;application
              </HomeSectionLink>
            </nav>
            <SheetFooter className="border-t border-[#281401]/10">
            
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="relative mt-auto w-full">
      <div
        className={`border-t border-[#281401]/10 bg-linear-to-b from-[#fffaeb] to-[#fef0c7]/90 py-10 shadow-[0_-8px_30px_-12px_rgba(40,20,1,0.12)] ${pageGutterX}`}
        role="contentinfo"
      >
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-4 lg:max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-[#281401] hover:opacity-90"
            >
              <BrandMark height={40} className="bg-transparent" />
              <span className="text-lg font-semibold tracking-tight">
                Balad&apos;indice
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-[#281401]/75">
              Quêtes, balades et chasses au trésor pour explorer la ville en
              famille.
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-12 lg:gap-16">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#281401]/50">
                Liens utiles
              </p>
              <nav
                className="flex flex-col gap-2.5 text-sm"
                aria-label="Liens du pied de page"
              >
                <Link
                  href="/contact"
                  className="text-[#281401]/85 underline-offset-4 hover:text-[#281401] hover:underline"
                >
                  Contact
                </Link>
                <Link
                  href="/mentions-legales"
                  className="text-[#281401]/85 underline-offset-4 hover:text-[#281401] hover:underline"
                >
                  Mentions légales
                </Link>
                <Link
                  href="/politique-confidentialite"
                  className="text-[#281401]/85 underline-offset-4 hover:text-[#281401] hover:underline"
                >
                  Politique de confidentialité
                </Link>
                <Link
                  href="/cgu"
                  className="text-[#281401]/85 underline-offset-4 hover:text-[#281401] hover:underline"
                >
                  Conditions d&apos;utilisation
                </Link>
              </nav>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#281401]/50">
                Suivez-nous
              </p>
              <div className="flex flex-wrap gap-3">
                <SocialLink
                  href={publicSocialLinks.facebook}
                  label="Facebook — Balad'indice (nouvel onglet)"
                >
                  <Facebook className={socialIconClass} strokeWidth={1.75} />
                </SocialLink>
                <SocialLink
                  href={publicSocialLinks.instagram}
                  label="Instagram — Balad'indice (nouvel onglet)"
                >
                  <Instagram className={socialIconClass} strokeWidth={1.75} />
                </SocialLink>
                <SocialLink
                  href={publicSocialLinks.discord}
                  label="Discord — Balad'indice (nouvel onglet)"
                >
                  <DiscordIcon className={socialIconClass} />
                </SocialLink>
                <SocialLink
                  href={publicSocialLinks.whatsapp}
                  label="WhatsApp — Balad'indice (nouvel onglet)"
                >
                  <WhatsAppIcon className={socialIconClass} />
                </SocialLink>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[#281401]/10 pt-8 text-center">
          <p className="text-sm text-[#281401]/75">
            Propulsé par <span aria-hidden>🚀</span>{" "}
            <a
              href="https://loluweb.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#281401]/90 underline-offset-2 transition-colors hover:text-[#281401] hover:underline"
            >
              Loluweb
            </a>
            <span className="mx-2 text-[#281401]/40" aria-hidden>
              ·
            </span>
            &copy; {new Date().getFullYear()} — Tous droits réservés
          </p>
          <p className="mt-3">
            <Link
              href="/admin-game"
              className="text-[0.65rem] font-normal tracking-wide text-[#281401]/30 underline-offset-4 transition-colors hover:text-[#281401]/55 hover:underline focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#68a618]/40 focus-visible:ring-offset-2"
              title="Connexion administration"
            >
              Espace équipe
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

export function UnauthenticatedChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-[#fffaeb] text-[#281401]">
      <Suspense fallback={null}>
        <AuthCallbackQueryToasts />
      </Suspense>
      <div className="relative z-10 flex min-h-dvh w-full flex-1 flex-col">
        <LandingHeader />
        {children}
        <PublicFooter />
      </div>
    </div>
  );
}
