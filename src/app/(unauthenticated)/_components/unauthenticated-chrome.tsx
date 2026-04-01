"use client";

import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

/** Même bandeau que l’accueil sur toutes les pages publiques (liens vers les ancres de `/`). */
function LandingHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <Link href="/" className="flex items-center gap-5 hover:opacity-90">
        <BrandMark height={50} className="bg-transparent" />
        <span className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Balad&apos;indice
        </span>
      </Link>
      <nav className="flex flex-wrap gap-4 sm:gap-6">
        <Link href="/#comment-ca-marche" className="hover:underline">
          Comment ça marche ?
        </Link>
        <Link href="/#questions" className="hover:underline">
          Questions
        </Link>
        <Link href="/#reviews" className="hover:underline">
          Avis
        </Link>
      </nav>
      <Button className="bg-[#68a618] text-base shrink-0" type="button">
        Télécharger l&apos;application
      </Button>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="mx-auto mt-auto flex w-full max-w-6xl flex-col items-center justify-center gap-8 border-t border-[#281401]/10 bg-[#fffaeb] p-5 text-center">
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-between sm:text-left">
        <p className="text-sm">&copy; 2026 LoluWeb — Tous droits réservés</p>
        <nav className="flex flex-wrap justify-center gap-4 sm:justify-end sm:gap-6">
          <Link href="#" className="text-sm hover:underline">
            Contact
          </Link>
          <Link href="/mentions-legales" className="text-sm hover:underline">
            Mentions légales
          </Link>
          <Link
            href="/politique-confidentialite"
            className="text-sm hover:underline"
          >
            Politique de confidentialité
          </Link>
          <Link href="/cgu" className="text-sm hover:underline">
            Conditions d&apos;utilisation
          </Link>
          <Link href="/cgu#droit" className="text-sm hover:underline">
            Droit applicable : France
          </Link>
        </nav>
      </div>
      <div className="flex w-full flex-col gap-3 border-t border-[#281401]/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Plateforme de gestion des parcours et du contenu. L&apos;accès au
          tableau de bord est réservé aux équipes habilitées.
        </p>
        <Link
          href="/admin-game"
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-none bg-[#68a618] px-6 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Espace administration
        </Link>
      </div>
    </footer>
  );
}

export function UnauthenticatedChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#fef0c7] text-[#281401]">
      <Image
        src="/images/background.jpg"
        alt=""
        fill
        className="object-cover"
        priority
      />
      <div className="relative z-10 flex min-h-screen flex-1 flex-col px-4 py-6 sm:py-10">
        <LandingHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <PublicFooter />
      </div>
    </div>
  );
}
