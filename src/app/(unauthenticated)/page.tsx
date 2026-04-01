import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Smartphone } from "@/components/photos";

export default function Home() {
  return (
    <div className="text-[#281401]">
      <header className="flex justify-between bg-[#fef0c7] border-b-2 border-dotted border-neutral-100 p-5">
        <h1 className="text-3xl font-semibold tracking-tight">
          Balad&apos;indice
        </h1>
        
        <nav className="flex gap-5">
          <div>Comment ça marche?</div>
          <div>Questions</div>
          <div>Avis</div>
        </nav>
        <Button className="bg-[#68a618] text-base">Télécharger l&apos;application</Button>
      </header>
      <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-[#fef0c7] px-6 py-16 ">
        <div className="max-w-6xl text-center bg-background flex flex-col gap-6 p-5">
          <div className="mb-6 flex justify-center">
            <BrandMark height={120} />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Balad&apos;indice
          </h1>
          <p className="text-3xl tracking-tight">
            Pars à l&apos;aventure avec Balad’indice et ton téléphone
          </p>
          <p>
            Balad’indice transforme la ville en une grande chasse au trésor.
            Scanne des QR codes avec ton téléphone, découvre des indices cachés
            et résous des énigmes. Au bout de l’aventure, un trésor t’attend!
          </p>
          <Smartphone />
          <div>
            <h2 className="text-xl font-semibold tracking-tight py-5">
              Prêt à commencer ton aventure?
            </h2>
            <Button className="bg-[#68a618] text-lg">
              Télécharger l&apos;application gratuitement
            </Button>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Plateforme de gestion des parcours et du contenu. L’accès au tableau
          de bord est réservé aux équipes habilitées.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/admin-game"
            className="inline-flex h-10 items-center justify-center rounded-none bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Espace administration
          </Link>
        </div>
      </div>
    </div>
  );
}
