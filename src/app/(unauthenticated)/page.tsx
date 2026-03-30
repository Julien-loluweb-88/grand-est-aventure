import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-6 py-16 text-foreground">
      <div className="max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <BrandMark height={120} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Balad&apos;indice</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Plateforme de gestion des parcours et du contenu. L’accès au tableau de
          bord est réservé aux équipes habilitées.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-none border border-input bg-background px-6 text-sm font-medium hover:bg-muted"
        >
          Connexion
        </Link>
        <Link
          href="/admin-game"
          className="inline-flex h-10 items-center justify-center rounded-none bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Espace administration
        </Link>
      </div>
    </div>
  );
}
