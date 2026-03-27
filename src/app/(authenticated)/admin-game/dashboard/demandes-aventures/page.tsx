import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { listAdventureCreationRequests } from "../aventures/request-adventure.action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DemandesAventuresTable } from "./DemandesAventuresTable";

export default async function DemandesAventuresPage() {
  const result = await listAdventureCreationRequests();

  if (!result.ok) {
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
            Demandes de création d&apos;aventure
          </CardTitle>
          <CardDescription>
            Les administrateurs clients envoient une demande lorsqu&apos;ils ne
            peuvent pas créer une aventure eux-mêmes. Traitez-les puis créez
            l&apos;aventure depuis votre compte super administrateur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DemandesAventuresTable requests={result.requests} />
        </CardContent>
      </Card>
    </div>
  );
}
