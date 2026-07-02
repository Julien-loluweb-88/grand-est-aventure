import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Au revoir",
  description: "Votre compte Balad'indice a été supprimé.",
  robots: { index: false, follow: false },
};

export default function AuRevoirPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <BrandMark height={72} className="mb-8 opacity-90" />
      <div className="mb-6 flex justify-center">
        <Image
          src="/images/treasure-vide.png"
          alt=""
          width={64}
          height={64}
          className="opacity-40 grayscale"
          aria-hidden
        />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-[#281401] sm:text-3xl">
        On espère te revoir un jour…
      </h1>
      <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-[#281401]/75">
        Ton compte Balad&apos;indice a été supprimé. Tes parcours, badges et préférences associés à
        ce compte ne sont plus accessibles avec cette identité.
      </p>
      <p className="mt-3 max-w-md text-sm text-[#281401]/60">
        Merci d&apos;avoir exploré la région avec nous. La carte reste ouverte si tu souhaites
        revenir plus tard.
      </p>
      <Button asChild className="mt-10 bg-[#68a618] hover:bg-[#5a9014]">
        <Link href="/">Retour à l&apos;accueil</Link>
      </Button>
    </div>
  );
}
