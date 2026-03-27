import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdventureById } from "./adventure.action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RemoveAdventureForm } from "./RemoveAdventure";
import { AdventureEditForm } from "./AdventureEditForm";
import { Adventure } from "../../../../../../../generated/prisma/browser";
import { StatusAdventure } from "./StatusAdventure";
import { CreateEnigmaForm } from "./EnigmaCreateForm";
import { ListEnigmaTable } from "./ListeEnigma";

export default async function AdventurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adventure = await getAdventureById(id);

  if (!adventure) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Aventure non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      <Link
        href="/admin-game/dashboard/aventures"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour à la liste
      </Link>

      <Card className="h-fit">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Informations de l&apos;aventure {adventure.name}
          </CardTitle>
          <CardDescription>ID: {adventure.id}</CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:gap-8">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Modification</CardTitle>
        <AdventureEditForm adventure={adventure as Adventure}/>
          </CardHeader>
          </Card>

        <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Modération</CardTitle>
            <CardDescription>
              Changement statut, suppression
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 w-fit mx-auto" >
          <StatusAdventure adventure={adventure as Adventure} />
          </CardContent>
          <CardContent className="flex flex-col gap-3 w-fit mx-auto">
            <RemoveAdventureForm adventure={adventure as Adventure} />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:gap-8">
      <Card className="relative">
  <div className="absolute top-4 right-4">
    <CreateEnigmaForm
       
    />
  </div>

  <CardHeader className="flex flex-col items-center text-center">
    <CardTitle>Énigme</CardTitle>
    <CardDescription>Liste des énigmes</CardDescription>
  </CardHeader>

  <CardContent>
    <ListEnigmaTable adventure={adventure as Adventure} />
  </CardContent>
</Card>
    
      </div>
    </div>
     </div>
  );
}
