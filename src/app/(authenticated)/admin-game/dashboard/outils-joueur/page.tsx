import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/auth-user";
import { isSuperadmin } from "@/lib/admin-access";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlayerProgressToolsPanel } from "./PlayerProgressToolsPanel";

export default async function OutilsJoueurPage() {
  const user = await getUser();
  if (!user || !isSuperadmin(user.role)) {
    redirect("/admin-game/dashboard/acces-refuse");
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      <Link
        href="/admin-game/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour au tableau de bord
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Outils progression joueur
          </CardTitle>
          <CardDescription>
            Forcer la fin d’une aventure, simuler avis / signalements (note, problèmes badge ou
            trésor) ou effacer la progression d’un compte pour les tests (app mobile, accueil,
            badges, roue partenaires). Accès réservé au super administrateur —
            ne pas utiliser en production sur de vrais joueurs sans précaution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlayerProgressToolsPanel />
        </CardContent>
      </Card>
    </div>
  );
}
