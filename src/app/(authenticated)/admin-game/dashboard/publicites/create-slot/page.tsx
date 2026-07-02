import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { listCitiesForAdventureSelect } from "@/lib/city-admin-queries";
import { listMerchantUsersForAdvertisementForm } from "../_lib/advertisement-admin-queries";
import { AdvertisementSlotForm } from "../_components/AdvertisementSlotForm";

export default async function CreateAdvertisementSlotPage() {
  const [cities, merchants] = await Promise.all([
    listCitiesForAdventureSelect(),
    listMerchantUsersForAdvertisementForm(),
  ]);

  if (!merchants) {
    redirect("/admin-game/dashboard/acces-refuse");
  }

  return (
    <div className="m-8 space-y-6">
      <Link
        href="/admin-game/dashboard/publicites"
        className="inline-flex text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        ← Publicités
      </Link>
      <Card className="h-fit p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Nouvel emplacement commerçant
          </CardTitle>
          <CardDescription>
            Définissez le ciblage et le commerçant. Le contenu (titre, image, texte) et l&apos;intitulé
            du gain seront remplis par le commerçant. L&apos;<strong>image du badge</strong> se
            téléverse sur la fiche publicité après création (section offre partenaire).
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <AdvertisementSlotForm cities={cities} merchantOptions={merchants} />
        </CardContent>
      </Card>
    </div>
  );
}
