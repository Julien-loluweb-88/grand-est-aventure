import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Accès refusé</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Vous êtes connecté, mais vous n&apos;avez pas les droits nécessaires pour cette section.
      </p>
      <Button asChild>
        <Link href="/admin-game/dashboard">Retour au tableau de bord</Link>
      </Button>
    </div>
  );
}
